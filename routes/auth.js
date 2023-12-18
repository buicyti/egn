var route = require('express').Router();
const knex = require('../db/db');
const {
    notification,
    listPermission
} = require('../const');
const bcrypt = require('bcrypt');
const {
    wrap
} = require('async-middleware');
const {
    isAuthenticated,
    verifyRequestBody,
    login,
    checkingPermision
} = require('../features/authentication');





//route.post('/per', wrap(getPermision));

route.get(['/', '/login'], function (req, res) {
    res.locals.title = "Đăng nhập";
    res.render('./pages/authentication/login');
});
route.get('/register', function (req, res) {
    res.locals.title = "Đăng kí";
    res.render('./pages/authentication/register');
});
route.get('/logout', function (req, res, next) {
    req.session.destroy();
    res.redirect('/auth/login')
});

route.get('/setting', wrap(isAuthenticated), function (req, res, next) {
    res.locals.title = "Cài đặt cho tài khoản";
    res.render('./pages/authentication/setting');
});



/***************************/
route.post('/login', wrap(verifyRequestBody), wrap(login));

route.post('/register/checkUser', wrap(checkUser), (req, res) => {
    return res.json(req.setUsers)
})

route.post('/register/checkID', wrap(checkID), (req, res) => {
    return res.json(req.setID)
})
route.post('/register/checkPass', wrap(checkPassword), (req, res) => {
    return res.json(req.setPassword)
})
route.post('/register/reg', wrap(checkUser), wrap(checkID), wrap(checkPassword), async (req, res) => {
    if (req.setUsers && req.setUsers.error) return;
    if (req.setID && req.setID.error) return;
    if (req.setPassword) {
        for (const keys in req.setPassword) {
            if (keys == 'error') return;
        }
    }

    const hashedPass = await bcrypt.hash(req.body.userPassword, 5);
    var kq = await knex('accounts')
        .insert({
            username: req.setUsers.value,
            password: hashedPass,
            id_employee: req.body.userID
        })
        .returning('username')
    return res.json(kq)

})



route.post('/admin/removeAcc', async function (req, res) {
    const addKey = ["admin.superadmin", "users.delete"];
    const checkKey = await checkingPermision(addKey, req.session.user); //kiểm tra quyền

    if (!checkKey) return res.json(notification.NOT_ENOUGH_AUTHORITY);
    //nếu có quyền thì thực hiện xoá
    var ks = await knex('accounts').where('id_employee', req.body.id).del()
    if (ks) {
        return res.json(`Đã xoá thành công tài khoản của ${req.body.name}`);
    } else return res.json(notification.NOT_EXIST_ACCOUNT);
})


route.post('/admin/resetPassword', async function (req, res) {
    const addKey = ["admin.superadmin", "users.update"];
    const checkKey = await checkingPermision(addKey, req.session.user); //kiểm tra quyền

    if (!checkKey) return res.json(notification.NOT_ENOUGH_AUTHORITY);
    //nếu có quyền thì thực hiện
    var ks = await knex('accounts').where('id_employee', req.body.id).update('password', await bcrypt.hash('Abc!23', 5));
    if (ks) return res.json(`Đã thay đổi về mật khẩu mặc định Abc!23 cho tài khoản của ${req.body.name}`);
    else return res.json(notification.NOT_EXIST_ACCOUNT);
})

route.post('/admin/activeAcc', async function (req, res) {
    const addKey = ["admin.superadmin", "users.active"];
    const checkKey = await checkingPermision(addKey, req.session.user); //kiểm tra quyền

    if (!checkKey) return res.json(notification.NOT_ENOUGH_AUTHORITY);
    //nếu có quyền thì thực hiện
    var ks = await knex('accounts').where('id_employee', req.body.id).update('status', req.body.id_key)
    if (ks) return res.json(`Đã thay đổi trạng thái tài khoản của ${req.body.name}`);
    else return res.json(notification.NOT_EXIST_ACCOUNT);
})
route.post('/admin/changePermission', async function (req, res) {
    const addKey = ["admin.superadmin", "users.update"];
    const checkKey = await checkingPermision(addKey, req.session.user); //kiểm tra quyền

    if (!checkKey) return res.json(notification.NOT_ENOUGH_AUTHORITY);
    //nếu có quyền thì thực hiện tiếp
    var data = req.body;
    var ma = req.body.id;
    delete data.id;
    Object.keys(data).map(async key => {
        //kiểm tra quyền trong CSDL
        var sl = await knex('permission').count(`id As Total`).where('id_employee', '=', ma).where('permission', '=', key);

        //nếu chọn và chưa có thì thêm vào
        if (data[key] && !sl[0].Total) {
            await knex('permission')
                .insert({
                    id_employee: ma,
                    permission: key
                })
        }
        //nếu không chọn mà có thì xoá đi
        else if (!data[key] && sl[0].Total) {
            await knex('permission')
                .where('id_employee', '=', ma)
                .where('permission', '=', key)
                .del()
        }
    })
    return res.json(notification.UPDATE_SUCCESS);

})

route.post('/admin/get_data', async function (req, res) {
    var col = []; //Tính số cột dựa vào tg bắt đầu và kết thúc
    Object.keys(listPermission).map(per => {
        listPermission[per].forEach(val => {
            col.push(`MAX(CASE WHEN permission = '${per}.${val}' THEN '1' ELSE '0' END) AS ${per + val}`)
        })
    })


    var total_records = await knex
        .count('id AS Total')
        .from('accounts')
        .first();

    var data_records = await knex.raw(`
    SELECT ROW_NUMBER() OVER (ORDER BY id ASC) + ${req.body.start} AS id, 
    id_employee, 
    name_employee, 
    status, 
    ${col.join()}
    FROM 
    (SELECT t1.id, t1.id_employee, t1.status, t2.permission, t3.name_employee 
    FROM dbo.accounts AS t1 LEFT JOIN dbo.permission AS t2 
    ON t1.id_employee = t2.id_employee 
    LEFT JOIN dbo.employees AS t3 
    ON t1.id_employee = t3.id_employee 
    WHERE t1.id_employee IN 
    (SELECT id_employee FROM dbo.accounts ORDER BY id ASC OFFSET ${req.body.start} ROWS FETCH NEXT ${req.body.length} ROWS ONLY)) 
    AS tmp GROUP BY id, id_employee, name_employee, status
    `)
    //xuất dữ liệu cho datatable
    var output = {
        'draw': req.body.draw,
        'iTotalRecords': total_records.Total,
        'iTotalDisplayRecords': total_records.Total, //total_records_with_filter[0].Total,
        'aaData': data_records
    };

    res.json(output);
});






route.post('/PIN/check', async (req, res) => {
    var kq = await knex
        .select('pin_code')
        .from('accounts')
        .where('username', req.session.user)
        .first();

    return res.json(kq['pin_code'])
})
route.post('/PIN/check2', async (req, res) => {
    var kq = await knex
        .count('id AS Total')
        .from('accounts')
        .where('username', req.session.user)
        .where('pin_code', req.body.pin_code);

    return res.json(kq[0].Total == '1' ? true : false)
})
route.post('/PIN/check3', async (req, res) => {
    var kq = await knex
        .select('password')
        .from('accounts')
        .where('username', req.session.user)
        .first();

    return res.json(await bcrypt.compare(req.body.password, kq.password));
})
route.post('/PIN/create', async (req, res) => {
    var kq = await knex('accounts')
        .where('username', req.session.user)
        .update({
            pin_code: req.body.pin_code
        })

    return res.json(kq)
})
/* ************************ */

async function checkUser(req, res, next) {
    var userRegister = req.body.userRegister;
    userRegister = await ConvertAccountName(userRegister);

    const isValidLength = /^.{4,20}$/;
    if (!isValidLength.test(userRegister)) {
        req.setUsers = {
            value: userRegister,
            error: `Tên tài khoản phải dài 4 - 20 ký tự.`
        }
        next();
    }


    await knex
        .count('id AS Total')
        .from('accounts')
        .where('username', userRegister)
        .first()
        .then(count => {
            if (count.Total == "0")
                req.setUsers = {
                    value: userRegister,
                    success: `Tài khoản hợp lệ`
                };
            else
                req.setUsers = {
                    value: userRegister,
                    error: `Đã tồn tại tài khoản <b>${userRegister}</b>. Vui lòng sử dụng tên tài khoản khác!`
                };
        });

    next();
}
async function checkID(req, res, next) {
    await knex
        .count('id AS Total')
        .from('employees')
        .where('id_employee', req.body.userID)
        .first()
        .then(async rows1 => {
            if (rows1.Total == '0')
                req.setID = {
                    error: `Mã nhân viên không hợp lệ!`
                }
            else {
                await knex
                    .count('id AS Total')
                    .from('accounts')
                    .where('id_employee', req.body.userID)
                    .first()
                    .then(rows2 => {
                        if (rows2.Total == "0")
                            req.setID = {
                                success: `Mã nhân viên hợp lệ`
                            }
                        else req.setID = {
                            error: `Mã nhân viên đã được sử dụng cho tài khoản khác!`
                        }
                    })
            }
        })
    next();
}

function checkPassword(req, res, next) {
    var dt = [];
    const isNonWhiteSpace = /^\S*$/;
    if (!isNonWhiteSpace.test(req.body.userPassword))
        dt.push({
            error: `Mật khẩu không được chứa khoảng trắng.`
        });
    else dt.push({
        success: `Không có khoảng trắng.`
    })
    const isContainsLetter = /^(?=.*[a-zA-Z]).*$/;
    if (!isContainsLetter.test(req.body.userPassword))
        dt.push({
            error: `Mật khẩu phải có ít nhất một ký tự chữ.`
        });
    else dt.push({
        success: `Đã có chữ.`
    })
    /* const isContainsUppercase = /^(?=.*[A-Z]).*$/;
    if (!isContainsUppercase.test(req.body.userPassword))
        dt.push({
            error: `Mật khẩu phải có ít nhất một ký tự chữ hoa.`
        });
    else dt.push({
        success: `Đã có chữ hoa.`
    }) */
    /* const isContainsLowercase = /^(?=.*[a-z]).*$/;
    if (!isContainsLowercase.test(req.body.userPassword))
        dt.push({
            error: `Mật khẩu phải có ít nhất một ký tự chữ thường.`
        });
    else dt.push({
        success: `Đã có chữ thường.`
    }) */
    const isContainsNumber = /^(?=.*[0-9]).*$/;
    if (!isContainsNumber.test(req.body.userPassword))
        dt.push({
            error: `Mật khẩu phải chứa ít nhất một chữ số.`
        });
    else dt.push({
        success: `Đã có chữ số.`
    })
    const isContainsVNI = /^(?=.*[áàảạãăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]).*$/;
    if (isContainsVNI.test(req.body.userPassword))
        dt.push({
            error: `Chứa dấu tiếng Việt.`
        });
    else dt.push({
        success: `Không chứa dấu tiếng Việt.`
    });
    /* const isContainsSymbol = /^(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹]).*$/;
    if (!isContainsSymbol.test(req.body.userPassword))
        dt.push({
            error: `Mật khẩu phải chứa ít nhất một Ký hiệu Đặc biệt.`
        });
    else dt.push({
        success: `Đã có kí tự đặc biệt`
    }) */
    const isValidLength = /^.{6,20}$/;
    if (!isValidLength.test(req.body.userPassword))
        dt.push({
            error: `Mật khẩu phải dài 6 - 20 ký tự.`
        });
    else dt.push({
        success: `Độ dài mật khẩu là <b>${req.body.userPassword.length}</b>.`
    })

    req.setPassword = dt;
    next();
}

async function ConvertAccountName(slug) {
    //Đổi chữ hoa thành chữ thường
    slug = slug.toLowerCase();
    //Đổi ký tự có dấu thành không dấu
    slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a');
    slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e');
    slug = slug.replace(/í|ì|ỉ|ĩ|ị/gi, 'i');
    slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o');
    slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u');
    slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y');
    slug = slug.replace(/đ/gi, 'd');
    //Xóa các ký tự đặt biệt
    slug = slug.replace(/\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;| |_/gi, '');

    return slug;
}










module.exports = route;