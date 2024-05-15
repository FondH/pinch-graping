
import datetime
from api import get_all_pds,get_all_available, go_buy, get_remote_data
from flask import Flask, render_template, request, jsonify, make_response, redirect, url_for
import pandas as pd
import threading
from field_json import save_field_info, load_field_info
from thread_queue import thread_schedule_push
import uuid
import json
from itertools import cycle


app = Flask(__name__)
app.config.from_pyfile('config.py')

cycle_proxy = app.config.get('proxy_pool') if app.config.get('proxy_pool') else None



days_data = {}  # 存储当前所有field状态 {0:pd, 1:pd, 2:pd, 3:pd}
tasks = {} # {'id':{"status": "completed", "result": url}, }
is_basic = False #cookie字典 是否初始化
cookie = {
        'LoginType': '1',
        'ASP.NET_SessionId': 'ohjqh5tpdozt0bk2chf0q20m',
        'JWTUserToken': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiNGEwN2VmMWYtODJmMC00NjAzLWJiNmYtMmNkZGE1N2EyZDc4IiwiZXhwIjoxNzE2MzY4OTYwLjAsImp0aSI6ImxnIiwiaWF0IjoiMjAyNC0wNS0xNSAyMTowOToyMCJ9.tkEw_6fHHWhuginVEuX2fcX5hG1vhMXG9BlCnpODOU4',
        'UserId': '4a07ef1f-82f0-4603-bb6f-2cdda57a2d78',
        'LoginSource': '1',

}

def set_cookie(response, key, value):
    response.set_cookie(key, json.dumps(value), httponly=True)

def get_cookie(key):

    value = request.cookies.get(key)
    return json.loads(value) if value else None

@app.route('/')
def index():
    global days_data, cookie, is_basic

    jwt = get_cookie('jwt')
    userid = get_cookie('uid')
    if jwt and userid:
        cookie['JWTUserToken'] = jwt
        cookie['UserId'] = userid
        is_basic = True
        days_data = load_field_info()

    return render_template('index.html', days_data=days_data)

@app.route('/get_data', methods=['GET'])
def get_data():
    global days_data
    def get_day(i):
        return f'{datetime.datetime.now().month}-{datetime.datetime.now().day+int(i)}(week{(datetime.datetime.now().weekday()+i)%7})'

    days_data = get_remote_data(cookie)

    if len(days_data):
        #save_field_info(days_data)
        print(f'dump the days_data(len:{len(days_data)}):')
        return jsonify({(i): days_data[int(i)].to_dict(orient='records') for i in range(len(days_data))})
    else:
        return {}

@app.route('/is_basic', methods=['GET'])
def get_basic():

    global is_basic, cookie
    return jsonify({'status':'1', 'jwt':cookie['JWTUserToken'], 'uid':cookie['UserId']} if is_basic else {'status':'0'})

@app.route('/set_basic', methods=['POST'])
def set_basic():
    global cookie, is_basic

    uid = request.form.get('uid')
    jwt = request.form.get('jwt')
    print(f'set_uid:{uid}.\nset_jwt:{jwt}')
    cookie['JWTUserToken'] = jwt
    cookie['UserId'] = uid
    is_basic = True

    response = make_response()
    set_cookie(response, 'jwt', cookie['JWTUserToken'])
    set_cookie(response, 'uid', cookie['UserId'])
    return jsonify({"status": "success", "uid": uid, "jwt":jwt})


def process_book(task_id, schedule, tup):
    # 处理账单任务
    # result {'status':}
    global days_data, cookie, cycle_proxy

    proxy = None
    if cycle_proxy:
        _proxy = next(cycle_proxy)
        proxy ={'http':_proxy, 'https':_proxy}

    result = thread_schedule_push(schedule,go_buy,tup,days_data, cookie,proxy)

    tasks[task_id] = {
        "status": f"{result['status']}",
        "result":  f"{result['result']}",
        "completed_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.route('/book', methods=['POST'])
def book_field():

    dateadd = request.form.getlist('dateadd[]')
    begin_time = request.form.getlist('begin_time[]')
    field_no = request.form.getlist('field_no[]')
    schedule = request.form.get('schedule') # 12:00

    tups = list(zip(dateadd, begin_time, field_no))
    print('-++-',tups)

    pay_url = ''
    if len(tups):
        task_id = str(uuid.uuid4())
        tasks[task_id] = {"status": "in_progress", "result": None}
        #process_book(task_id,schedule,tups)
        t = threading.Thread(target=process_book, args=(task_id,schedule,tups,))
        t.start()


    # return redirect(pay_url)
        return jsonify({'success': 1, 'task_id': task_id})

    return jsonify({'success':0})

@app.route('/get_price', methods=['GET'])
def get_price():
    day = int(request.args.get('add_day'))
    field_no = request.args.get('field_no')
    begin_time = request.args.get('begin_time')

    try:
        field = days_data[day][(days_data[day]['FieldNo'] == field_no) & (days_data[day]['BeginTime'] == begin_time)]

        if not field.empty:
            price = field.iloc[0]['FinalPrice']
            return jsonify({"price": price})

    except:
        pass


    return jsonify({"price": "-"})

@app.route('/task_status/<task_id>', methods=['GET'])
def task_status(task_id):
    task = tasks.get(task_id, None)
    if task:
        return jsonify({
            'status': task.get('status', None),
            'result': task.get('result', None),
            'completed_time': task.get('completed_time', None)
        })
    else:
        return jsonify({
            'status': 'pending',
            'result': None,
            'completed_time': None
        })


if __name__ == '__main__':
    #days_data = get_remote_data(cookie)
    # process_book('123', None,  [('2', '8:00', 'JNYMQ001')])
    # print(tasks)
    #field = days_data[0][(days_data[0]['FieldNo'] == 1) & (days_data[0]['BeginTime'] == '9:00')]


    try:
        app.run(port=app.config['PORT'], debug=app.config['DEBUG'])

    except Exception as e:
        print(e)

    finally:
        save_field_info(days_data)
