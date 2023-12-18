//loader
$(window).on('load', () => {
    $('.se-pre-con').fadeOut("slow")
})

//show/hide sidebar
$('.collapse-menu-bar, .end-sidebar').on('click', () => {
    $('.sidebar-menu').toggleClass('active');
    $('.end-sidebar').toggleClass('show');

})


//sự kiện click để mở sidebar ở chế độ tab
$('.sidebar-menu .dropdown>a').on('click', function () {
    if ($(window).width() < 992) {
        if ($(this).parent().hasClass('active')) {
            $(this).parent().removeClass('active'); //nếu đang mở thì đóng lại
        } else {
            $('li.dropdown', $(this).parents('ul.sidebar-menu')).removeClass('active'); // bỏ class active ul đang mở
            $(this).parent().addClass('active');
        }

        return false;
    }
})

//thay đổi giao diện sáng tối
const themeSwitch = $('#changeTheme'); //vị trí checkbox theme
const currentTheme = localStorage.getItem('theme'); //lấy giá trị trong biến lưu theme
if (currentTheme) {
    $('body').removeClass('light-mode dark-mode').addClass(currentTheme)
    //nếu đang là chế độ tối thì tick vào checkbox
    if (currentTheme === 'dark-mode')
        themeSwitch.prop('checked', true);
}

themeSwitch.on('change', function (e) {
    if (e.target.checked) {
        $('body').removeClass('light-mode dark-mode').addClass('dark-mode')
        localStorage.setItem('theme', 'dark-mode');
    } else {
        $('body').removeClass('light-mode dark-mode').addClass('light-mode ')
        localStorage.setItem('theme', 'light-mode');
    }
})

$('.password i').on('click', function () {
    if ($(this).hasClass('fa-eye')) {
        $(this).parent().find('input').attr('type', 'text')
        $(this).removeClass('fa-eye fa-eye-slash').addClass('fa-eye-slash')
    } else {
        $(this).parent().find('input').attr('type', 'password')
        $(this).removeClass('fa-eye fa-eye-slash').addClass('fa-eye')
    }
})

const loginExpired = () => {
    let dt = new Date();
    dt.setMinutes(dt.getMinutes() + 30); //cài thời gian sống 30 phút
    sessionStorage.setItem('loginExpiredTime', dt); //lưu vào bộ nhớ phiên
}

$(document).ready(async function () {
    var countpath = window.location.pathname.split('/').slice(1).length;
    var pathname = $('.sidebar-menu a[href="' + window.location.pathname + '"]');
    const check_PIN = await getFetchs('/auth/PIN/check'); //kiểm tra xem đã đặt mã PIN chưa

    pathname.parent().addClass('active');
    if (countpath > 1) pathname.parent().parent().parent().addClass('active');
    if (countpath > 2) pathname.parent().parent().parent().parent().parent().addClass('active');


    loginExpired(); //cập nhật mỗi khi load trang
    unlock();
    setInterval(unlock, 5000);


});

const unlock = () => {
    const expiresLoginTime = sessionStorage.getItem('loginExpiredTime');
    const expiresLoginValue = sessionStorage.getItem('loginExpiredValue');
    //nếu quá thời gian thì hiện màn hình khoá
    if (new Date(expiresLoginTime) < new Date() || expiresLoginValue == 'locked') {
        sessionStorage.setItem('loginExpiredValue', 'locked'); //đặt giá trị về khoá
        if (!$(document).find('.lock-account').length && check_PIN != null) {
            $(document.body).append(`
            <div class="lock-account d-flex justify-content-center align-items-center">
                <div class="row lockscreen">
                    <div class="lock-image col-12 col-md-6"></div>
                    <div class="login-form col-12 col-md-6 p-3">
                        <h3 class="fw-bold">Khoá màn hình</h3>
                        <div class="form-group align-locking">
                            <p>Bạn đã không hoạt động trong 30 phút rồi. Nhập mật khẩu để đăng nhập lại</p>
                            <div id="otp-inputs">
                                <input class="otp-input" type="text" name="pass_unlocking" inputmode="numeric" maxlength="1" />
                                <input class="otp-input" type="text" name="pass_unlocking" inputmode="numeric" maxlength="1" />
                                <input class="otp-input" type="text" name="pass_unlocking" inputmode="numeric" maxlength="1" />
                                <input class="otp-input" type="text" name="pass_unlocking" inputmode="numeric" maxlength="1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>`);
            //xoá giá trị cũ
            $('#otp-inputs input').on('click', e => $(e.currentTarget).val(''))
            //sự kiện nhập vào
            $('#otp-inputs input').on('input', async e => {
                const input_current = $(e.currentTarget);
                //nếu đầu vào nhập vào không phải là số thì xoá đi và kết thúc hàm
                if (isNaN(input_current.val())) {
                    input_current.val('')
                    return;
                }
                //nếu nhập vào là số thì chuyển sang nút kế tiếp
                if (input_current.val() != '') {
                    const next = input_current.next();
                    if (next.length) {
                        next.val('');
                        next.focus();
                    } else {
                        var val = '';
                        $('#otp-inputs input').each(function (i, item) {
                            val += $(item).val();
                        })
                        var kq = await getFetchs('/auth/PIN/check2', {
                            pin_code: val
                        })
                        kq && unlockLogin();
                        kq && $(document).find('.lock-account').remove();
                    }
                }
            })
            //sự kiện ấn nút xoá hoặc quay lại
            $('#otp-inputs input').on('keyup', e => {
                const input_current = $(e.currentTarget);
                const prev = input_current.prev();
                //khi ấn nút Delete hoặc nút Backspace
                if (e.which == 8 || e.which == 46) {
                    input_current.val('')
                    if (prev.length) {
                        prev.val('');
                        prev.focus();
                    }
                }
            })
        } else if (!$(document).find('.lock-account').length && check_PIN == null) {
            $(document.body).append(`
            <div class="lock-account d-flex justify-content-center align-items-center">
                <div class="row lockscreen">
                    <div class="lock-image col-12 col-md-6"></div>
                    <div class="login-form col-12 col-md-6 p-3">
                        <h3 class="fw-bold">Khoá màn hình</h3>
                        <div class="form-group align-locking">
                            <p>Bạn đã không hoạt động trong 30 phút rồi. Nhập mật khẩu để đăng nhập lại</p>
                            <div class="input-group mb-3">
                                <input type="text" id="unlockpass" class="form-control" placeholder="Nhập mật khẩu để mở khoá">
                                <button class="btn btn-secondary" type="button" id="unlock">Mở khoá</button>
                            </div>
                            <p>Để thao tác mở khoá nhanh hơn. Vào phần Cài đặt -> Mã PIN -> Đặt mã PIN</p>
                        </div>
                    </div>
                </div>
            </div>`);
            $('#unlock').on('click', async () => {
                var kq = await getFetchs('/auth/PIN/check3', {
                    password: $('#unlockpass').val()
                })
                kq && unlockLogin();
                kq && $(document).find('.lock-account').remove();
            })
        }
    }
}
const unlockLogin = () => {
    loginExpired();
    sessionStorage.setItem('loginExpiredValue', 'unlock');
}

const getFetch = (link, jsonData) => fetch(link, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonData)
}).then(res => {
    unlockLogin();
    if (res.ok) return res.json();
    return {
        error: err
    }
}).catch(err => {
    console.error(err)
    return {
        error: err
    }
})
const getFetchs = (link, jsonData) => fetch(link, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonData)
}).then(res => {
    loginExpired();
    if (res.ok) return res.json();
    return {
        error: err
    }
}).catch(err => {
    console.error(err)
    return {
        error: err
    }
})