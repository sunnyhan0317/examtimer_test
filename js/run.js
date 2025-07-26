document.addEventListener("DOMContentLoaded", function () {
    const fc_btn = document.getElementById('fullscreen_btn');
    const fc_target = document.getElementById('output');

    fc_btn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            fc_target.requestFullscreen();
        }
        else {
            document.exitFullscreen();
        }
    });
});

function open_input() {
    var input_show = document.getElementById("add");
    if (input_show.style.display == "none") {
        input_show.style.display = "block";
    } else {
        input_show.style.display = "none";
    }

    let open_button = document.getElementById("add_subject");
    if (open_button.innerText == "add subject") {
        open_button.innerText = "Close";
    }
    else {
        open_button.innerText = "add subject";
    }
}

// show subject
let n = 0;

let subject = []; // Array to store subjects
let subject2 = [];
let start_time = []; // Array to store start times
let end_time = []; // Array to store end times
let change_class_no = [];

let lastSelected = null;

document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('mousedown', function (e) {
        if (this === lastSelected) {
            this.checked = false;
            lastSelected = null;
        } else {
            lastSelected = this;
        }
    });
});

var first_input = false;

$('#select_grade').change(function () {
    var grade = $('#select_grade').val();
    fetch('https://sunnyhan0317.github.io/examtimer_test/grade_select', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            grade: grade,
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const sheetArray = data.data; // 每一列是一個陣列
                console.log(sheetArray);

                // 例如：
                sheetArray.forEach(row => {
                    const [start_time, end_time, subject, change_class_no] = row;
                    // 這裡可以儲存到你的前端陣列中
                });
            }
        });

    for (let i = 0; i < start_time.length; i++) {
        const scheduleElement = document.getElementById("schedule");
    
        scheduleElement.innerHTML += start_time[n] + " ~ " + end_time[n] + " " + subject[n] + " " + change_class + "<br>";
    }
});

function add_ifm() {
    subject[n] = document.getElementById("subject").value;
    subject2[n] = document.getElementById("subject2").value;
    start_time[n] = document.getElementById("start_time").value;
    end_time[n] = document.getElementById("end_time").value;
    change_class_no = document.getElementById("change_class_no").checked;

    if (subject[n] == '') {
        alert('請輸入科目');
        return;
    }

    if (start_time[n] == '') {
        alert('請輸入開始時間');
        return;
    }

    if (end_time[n] == '') {
        alert('請輸入結束時間');
        return;
    }

    first_input = true;

    if (change_class_no) change_class = ' /原';
    else change_class = '';

    // clear the input box
    document.getElementById("subject").value = '';
    document.getElementById("subject2").value = '';
    document.getElementById("start_time").value = '';
    document.getElementById("end_time").value = '';

    document.getElementById("change_class_no").checked = false;

    // Update schedule
    const scheduleElement = document.getElementById("schedule");
    if (subject2[n] === '') {
        scheduleElement.innerHTML += start_time[n] + " ~ " + end_time[n] + " " + subject[n] + " " + change_class + "<br>";
    }
    else {
        scheduleElement.innerHTML += start_time[n] + " ~ " + end_time[n] + " " + subject[n] + "/" + subject2[n] + "<br>" + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + "<br>";
    }

    n++;
}


//count down time 
let now = new Date();
let now_hours = now.getHours();
let now_minutes = now.getMinutes();

function counter() {
    let now = new Date();
    let now_hours = now.getHours();
    let now_minutes = now.getMinutes();
    let now_seconds = now.getSeconds();

    let now_time_in_minutes = now_hours * 60 + now_minutes;

    let found = false;

    for (let i = 0; i < n; i++) {
        const [start_hours, start_minutes] = start_time[i].split(":").map(Number);
        const [end_hours, end_minutes] = end_time[i].split(":").map(Number);

        const start_time_in_minutes = start_hours * 60 + start_minutes;
        const end_time_in_minutes = end_hours * 60 + end_minutes;

        if (now_time_in_minutes >= start_time_in_minutes && now_time_in_minutes < end_time_in_minutes) {
            found = true;
            if (subject2[i] == '') {
                document.getElementById("arrive_subject").innerHTML = subject[i];
            } else {
                document.getElementById("arrive_subject").innerHTML = subject[i] + "/" + subject2[i];
            }

            let left_minutes = end_time_in_minutes - now_time_in_minutes;
            document.getElementById("count_down").innerHTML = left_minutes + " min";
            break;
        }
    }

    if (!found) {
        // 不在課堂時間內，找下一節課
        let next_index = -1;
        for (let i = 0; i < n; i++) {
            const [start_hours, start_minutes] = start_time[i].split(":").map(Number);
            const start_time_in_minutes = start_hours * 60 + start_minutes;
            if (start_time_in_minutes > now_time_in_minutes) {
                next_index = i;
                break;
            }
        }

        if (next_index !== -1) {
            let [next_hours, next_minutes] = start_time[next_index].split(":").map(Number);
            let next_time_in_minutes = next_hours * 60 + next_minutes;
            let wait_minutes = next_time_in_minutes - now_time_in_minutes;

            if (subject2[i] == '') {
                document.getElementById("arrive_subject").innerHTML = "下節 " + subject[next_index];
            } else {
                document.getElementById("arrive_subject").innerHTML = "下節 " + subject[next_index] + "/" + subject2[next_index];
            }

            document.getElementById("count_down").innerHTML = "還有" + " " + wait_minutes + " min";
        } else {
            if (first_input === true) {
                document.getElementById("arrive_subject").innerHTML = "全部結束";
            }
            else {
                document.getElementById("arrive_subject").innerHTML = " ";
            }

            document.getElementById("count_down").innerHTML = " ";
        }
    }
}

const fileInput = document.getElementById('fileInput');
const previewImg = document.getElementById('preview');

let uploadedImageData = null;

fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            uploadedImageData = e.target.result;
            previewImg.src = uploadedImageData;
        };

        reader.readAsDataURL(file);
    }
});

setInterval(counter, 1000);