const Joi = require('joi');
const knex = require('../db/db');
const bcrypt = require('bcrypt');
const {
    Promise
} = require('mssql');


const PASSWORD_MIN = 6;
const PASSWORD_MAX = 30;
const PASSWORD_MAX_ERROR = `Độ dài mật khẩu không quá ${PASSWORD_MAX} ký tự`;
const PASSWORD_MIN_ERROR = `Độ dài mật khẩu phải dài ít nhất ${PASSWORD_MIN} ký tự`;
const USER_ALPHANUM = `Tên tài khoản phải là chữ hoặc số`;
const PASSWORD_EMPTY = `Mật khẩu không được trống`;
const PASSWORD_REQUIRED = `Mật khẩu bắt buộc phải nhập`;
const PASSWORD_COMBINATION_ERROR = 'Mật khẩu sai';
const USER_EMPTY = `Tên tài khoản không được trống`;
const USER_REQUIRED = `Tên tài khoản bắt buộc phải nhập`;
const USERNAME_ERROR = 'Tên tài khoản không hợp lệ';
const USERNAME_COMBINATION_ERROR = 'Tài khoản không tồn tại';
const INTERNAL_SERVER_ERROR = 'Đã xảy ra lỗi! Vui lòng thử lại.';
const SUCCESSFULLY_LOGGED_IN = 'Bạn đã đăng nhập thành công.';
const USER_NOT_ACTIVE = `Tài khoản của bạn chưa được kích hoạt`;


//kiểm tra đăng nhập
async function isAuthenticated(req, res, next) {
    if (req.session.user) {
        res.locals.userInfo = await getEmployee(req.session.user); //lấy thông tin nhân viên
        res.locals.userPermision = await getPermision(req.session.user); //lấy thông tin quyền
        return next();
    } else {
        return res.redirect('/auth/login');
    }
}
const getEmployee = async (sess_user) => {
    return await knex
        .select(
            't2.id_employee',
            't2.name_employee',
            't2.title',
            't2.job',
            't2.part',
            't2.shift'
        )
        .from('accounts AS t1')
        .leftJoin('employees AS t2', 't1.id_employee', 't2.id_employee')
        .where('t1.username', '=', sess_user)
        .first();
}

const getPermision = async (sess) => {
    const userPermision = await knex
        .select('t2.permission')
        .from('accounts AS t1')
        .rightJoin('permission AS t2', 't1.id_employee', 't2.id_employee')
        .where('t1.username', '=', sess);


    return userPermision.map(per => per.permission);
}


const getGroups = async () => {
    const userGroup = await knex
        .select('part')
        .from('employees')
        .groupBy('part')

    return userGroup.map(p => p.part);
}
const getShifts = async () => {
    const userGroup = await knex
        .select('shift')
        .from('employees')
        .groupBy('shift')

    return userGroup.map(p => p.shift);
}
const getRanks = async () => {
    const userGroup = await knex
        .select('rank')
        .from('employees')
        .groupBy('rank')

    return userGroup.map(p => p.rank);
}

const getStatus = async () => {
    const userGroup = await knex
        .select('status')
        .from('employees')
        .groupBy('status')

    return userGroup.map(p => p.status);
}
async function checkingPermision(permission, sess) {
    const b = await getPermision(sess);
    let c = false;
    permission.forEach(check => {
        if (b.indexOf(check) >= 0) {
            c = true;
            return;
        }
    })
    return c;
}
//kiểm tra đầu vào
const schema = Joi.object().keys({
    username: Joi.string()
        .alphanum()
        .required()
        .messages({
            'string.alphanum': USER_ALPHANUM,
            'string.empty': USER_EMPTY,
            'any.required': USER_REQUIRED
        }),
    password: Joi.string()
        .min(PASSWORD_MIN)
        .max(PASSWORD_MAX)
        .required()
        .messages({
            'string.base': `Mật khẩu phải thuộc dạng text`,
            'string.empty': PASSWORD_EMPTY,
            'any.required': PASSWORD_REQUIRED,
            'string.min': PASSWORD_MIN_ERROR,
            'string.max': PASSWORD_MAX_ERROR,
        })
});
async function verifyRequestBody(req, res, next) {
    const {
        error,
        value
    } = schema.validate({
        username: req.body.username,
        password: req.body.password
    });
    if (error)
        return res.json({
            status: 'error',
            error: error.details[0].message
        })

    return next();
}



const authenticateUser = (username) => {
    return knex.select().from('accounts').where("username", username)
        .then((users) => {
            if (users.length > 0)
                return Promise.resolve(users[0]);
            else
                return Promise.resolve(false);
        })
        .finally(function () {
            //knex.destroy();
        });
}
async function login(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;

    //const hashedPass = await bcrypt.hash('123456', 5);

    authenticateUser(username).then(async user => {
        //kiểm tra có dữ liệu hay không? nếu không có dữ liệu tức là không tồn tại user
        if (!user)
            return res.json({
                status: 'error',
                error: USERNAME_COMBINATION_ERROR
            })

        //kiểm tra có sai mật khẩu không?
        if (!await bcrypt.compare(password, user.password))
            return res.json({
                status: 'error',
                error: PASSWORD_COMBINATION_ERROR
            })

        //kiểm tra tài khoản đã được kích hoạt hay chưa?
        if (user.status != '1')
            return res.json({
                status: 'error',
                error: USER_NOT_ACTIVE
            })

        //nếu đúng user và pass thì chuyển đến trang index
        req.session.user = username;
        //res.redirect('');
        return res.json({
            status: 'success',
            success: SUCCESSFULLY_LOGGED_IN
        })
    })
}





module.exports = {
    isAuthenticated,
    verifyRequestBody,
    login,
    getPermision,
    getEmployee,
    getGroups,
    getShifts,
    getRanks,
    getStatus,
    checkingPermision
}