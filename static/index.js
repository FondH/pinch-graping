let entryCount = 0;

// Function to fetch and display data
function fetchData() {
    $.get('/get_data', function(data) {
        $('#fields_data').empty();
        let i =0;
        let today = new Date();

        for (var day in data) {

            var table = '<h2 class="mt-4">' + getDateByIndex(i) + '</h2>';
            table += '<table class="table table-striped table-bordered"><thead><tr>';
            table += '<th>Field Name</th><th>Begin Time</th><th>End Time</th><th>Field No</th><th>Final Price</th><th>Field Type No</th><th>Field State</th><th>Time Status</th><th>Is Avai</th>';
            table += '</tr></thead><tbody>';
            data[day].forEach(function(row) {
                table += '<tr>';
                for (var key in row) {
                    table += '<td>' + row[key] + '</td>';
                }
                //console.log(data)
                table += `<td><button type="button" class="btn btn-primary" onclick="addBookingEntryWithData('${i}', '${row['BeginTime']}', '${row['FieldNo']}', '${row['FinalPrice']}')">Add</button></td>`;
                table += '</tr>';
            });
            table += '</tbody></table>';
            $('#fields_data').append(table);
            i++;
        }
    });
}

// Fetch price based on field_no and begin_time
function fetchPrice(entry) {
    var day = entry.find('.dateadd').val();
    var field_no = entry.find('.field_no').val();
    var begin_time = entry.find('.begin_time').val();
    var priceInput = entry.find('.price');
    console.log(day, field_no, begin_time);
    $.get('/get_price', { add_day: day, field_no: field_no, begin_time: begin_time }, function(data) {
        priceInput.val(data.price);
    });
}

function addBookingEntry() {
    entryCount++;
    let entryHtml = `<div class="booking-entry row" id="entry-${entryCount}">
        <hr class="col-12">
        <div class="form-group col-md-2">
            <label>Date:</label>
            <select name="dateadd[]" class="form-control dateadd">
                ${generateDayOptions()}
            </select>
        </div>
        <div class="form-group col-md-2">
            <label>Begin Time:</label>
            <select name="begin_time[]" class="form-control begin_time">
                ${generateTimeOptions()}
            </select>
        </div>
        <div class="form-group col-md-2">
            <label>Field No:</label>
            <select name="field_no[]" class="form-control field_no">
                ${generateOptions()}
            </select>
        </div>
        <div class="form-group col-md-2">
            <label>Price:</label>
            <input type="text" name="price[]" class="form-control price" readonly>
        </div>
        <div class="form-group col-md-2 d-flex align-items-end">
            <button type="button" class="btn btn-danger remove-entry" onclick="removeEntry('entry-${entryCount}')">Remove</button>
        </div>
    </div>`;
    $('#booking_entries').append(entryHtml);

    // Attach change event handler for new elements
    $('#entry-' + entryCount + ' .field_no, #entry-' + entryCount + ' .begin_time, #entry-' + entryCount + ' .dateadd').change(function() {
        fetchPrice($(this).closest('.booking-entry'));
    });

    fetchPrice($('#entry-' + entryCount));
}


function addBookingEntryWithData(day, beginTime, fieldNo, price) {
    console.log(day, beginTime, fieldNo, price)
    entryCount++;
    let entryHtml = `<div class="booking-entry row" id="entry-${entryCount}">
        <hr class="col-12">
        <div class="form-group col-md-2">
            <label>Date:</label>
            <select name="dateadd[]" class="form-control dateadd" >
                ${generateDayOptions(day)};
            </select>
        </div>
        <div class="form-group col-md-2">
            <label>Begin Time:</label>
            <select name="begin_time[]" class="form-control begin_time">
                ${generateTimeOptions(beginTime)}
            </select>
        </div>
        <div class="form-group col-md-2">
            <label>Field No:</label>
            <select name="field_no[]" class="form-control field_no">
                ${generateOptions(fieldNo)}
            </select>
        </div>
        <div class="form-group col-md-2">
            <label>Price:</label>
            <input type="text" name="price[]" class="form-control price" value="${price}" readonly>
        </div>
        <div class="form-group col-md-2 d-flex align-items-end">
            <button type="button" class="btn btn-danger remove-entry" onclick="removeEntry('entry-${entryCount}')">Remove</button>
        </div>
    </div>`;
    $('#booking_entries').append(entryHtml);

    // Attach change event handler for new elements
    $('#entry-' + entryCount + ' .field_no, #entry-' + entryCount + ' .begin_time, #entry-' + entryCount + ' .dateadd').change(function() {
        fetchPrice($(this).closest('.booking-entry'));
    });

    fetchPrice($('#entry-' + entryCount));
}


function checkTaskStatus(taskId) {
    $.get('/task_status/' + taskId, function(response) {
        if (response.status === 'completed') {
            // 任务完成，显示结果
            $("#task_" + taskId + " .status").text(response.status);
            $("#task_" + taskId + " .result").html(`<a href="${response.result}" target="_blank">Paying url</a>`);
            $("#task_" + taskId + " .completed_time").text(response.completed_time);
        } else {
            // 任务未完成，继续轮询
            setTimeout(function() {
                checkTaskStatus(taskId);
            }, 2500); // 每秒轮询一次
        }
    });
}

// Function to generate options for select fields
function generateOptions(selectedFieldNo) {
    const fieldNos = ["JNYMQ001", "JNYMQ002", "JNYMQ003", "JNYMQ004", "JNYMQ005", "JNYMQ006", "JNYMQ007", "JNYMQ008", "JNYMQ009", "JNYMQ010", "JNYMQ011", "JNYMQ012", "JNYMQ013", "JNYMQ014"];
    let options = '';
    for  (let i = 0; i < 14; i++) {
        options += `<option value="${fieldNos[i]}"${fieldNos[i] === selectedFieldNo ? 'selected':''}>${i+1}</option>`;
    }
    return options;
}

// Function to generate time options for select fields
function generateTimeOptions(selectedTime) {
    const times = ["8:00", "9:00", "10:00", "11:00", "12:00", "13:30", "14:00", "15:00", "16:00", "19:00", "20:00", "21:00", "22:00"];
    let options = '';
    for (let time of times) {
        options += `<option value="${time}"${time === selectedTime ? ' selected' : ''}>${time}</option>`;
    }
    return options;
}
function generateDayOptions(day) {

    const taday = new Date();
    let options = ''
    for (let i = 0; i < 4; i++) {

        options += `<option value="${i}"${i === Number(day) ? 'selected':''}>${getDateByIndex(i)}</option>`
    }
    return options;
}

// 定义一个函数来获取指定索引的日期
function getDateByIndex(index) {

    let currentDate = new Date();

    currentDate.setDate(currentDate.getDate() + index);
    let month = currentDate.getMonth() + 1; // 月份从0开始，所以需要加1
    let day = currentDate.getDate();

    let daysOfWeek = ["日", "一", "二", "三", "四", "五", "六"];
    let dayOfWeek = daysOfWeek[currentDate.getDay()];


    return `${month}-${day} 周${dayOfWeek}`;
}

function getIsBasic(){
    var jwt = $('#jwt');
    var uid = $('#uid');
    $.get('/is_basic', function(data) {

        if(data.status === '1'){
            alert('userid:'+ data.uid + 'load cookies');
        }
        jwt.val(data.jwt);
        uid.val(data.uid);
    });


}