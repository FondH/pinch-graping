- `jwt` 和 `uid` 均需要在浏览器中登录eamis, 开发者界面查看coolies 中的`JWTUserToken` 和`UserId`

- 注意一次性book **多**个时，每一次提交的多个book，均属同一天

- schedule 意思为到点进行抢，输入方式为24小时制的字符串，例如11:22(当然12点开始抢最新的)

- 关于并发去发起订单申请， 对应多线程并发代码在`thread_queue.py` 中 `thread_schedule_push`函数，默认5线程并发。

- 代理池部分设置config.py中proxy列表（不需要为[None]即可）

  
