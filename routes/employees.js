var route = require('express').Router();
const fs = require('fs');
const knex = require('../db/db');
const {
    listPermission
} = require('../const');
const {
    wrap
} = require('async-middleware');
const {
    isAuthenticated,
    getGroups,
    getShifts,
    getRanks,
    getStatus,
    checkingPermision,
} = require('../features/authentication');
const moment = require('moment')
const multer = require("multer");
// SET STORAGE
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/temp/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + req.session.user + '_' + file.originalname);
    }
})
var upload = multer({
    storage: storage
})
const xlsx = require("read-excel-file/node");






route.get(['/', '/infomation'], isAuthenticated, async function (req, res) {
    res.locals.listPart = await getGroups();
    res.locals.listShift = await getShifts();
    res.locals.listRank = await getRanks();
    res.locals.listStatus = await getStatus();
    res.locals.title = "Thông tin nhân viên";
    res.render('./pages/employees/info');
});

route.get('/esd', isAuthenticated, async function (req, res) {
    res.locals.listPart = await getGroups();
    res.locals.listShift = await getShifts();
    res.locals.title = "Kết quả ESD";
    res.render('./pages/employees/esd');
});

route.get('/HRM', isAuthenticated, async function (req, res) {
    res.locals.listPermission = listPermission
    res.locals.title = "Quản lý tài khoản";

    res.render('./pages/employees/admin');
});



route.get('/infomation/:id(\\d{7})', isAuthenticated, async function (req, res) {
    res.locals.info = await knex
        .select()
        .from('employees')
        .where('id_employee', req.params.id)
        .first()
    res.locals.title = "Thông tin";
    res.render('./pages/employees/read');
})




//lấy danh sách nhân viên
route.post('/infomation/get_data', async function (req, res, next) {
    var order_data = req.body.order;
    var search_value = req.body.search.value;
    //khai báo biến bộ lọc
    if (typeof order_data == 'undefined') {
        var column_name = 'id';
        var column_sort_order = 'asc';
    } else {
        var column_name = req.body.columns[req.body.order[0].column].data;
        var column_sort_order = req.body.order[0].dir;
    }
    //lấy tổng số dòng trong bảng khi chưa lọc
    var total_records = await knex
        .count('id AS Total')
        .from('employees')
        .whereIn('part', req.body.gr)
        .whereIn('status', req.body.stt)
        .whereIn('shift', req.body.sf);
    //lấy tổng số dòng khi đã lọc
    var total_records_with_filter = await knex
        .count('id AS Total')
        .from('employees')
        .where(function () {
            this.whereIn('part', req.body.gr)
                .whereIn('status', req.body.stt)
                .whereIn('shift', req.body.sf)
        })
        .andWhere(function () {
            this.whereILike('id_employee', `%${search_value}%`)
                .orWhere(knex.raw(`contains(name_employee , '%${search_value}%')`))
        })


    //lấy dữ liệu
    var data_records = await knex
        .select(knex.raw(`ROW_NUMBER() OVER (ORDER BY id ASC) AS id_no, *`))
        .from('employees')
        .where(function () {
            this.whereIn('part', req.body.gr)
                .whereIn('status', req.body.stt)
                .whereIn('shift', req.body.sf)
        })
        .andWhere(function () {
            this.whereILike('id_employee', `%${search_value}%`)
                .orWhere(knex.raw(`contains(name_employee , '%${search_value}%')`))
        })
        .orderBy(column_name, column_sort_order)
        .limit(req.body.length, {
            skipBinding: true
        })
        .offset(req.body.start)

    //xuất dữ liệu cho datatable
    var output = {
        'draw': req.body.draw,
        'iTotalRecords': total_records[0].Total,
        'iTotalDisplayRecords': total_records_with_filter[0].Total,
        'aaData': data_records
    };

    res.json(output);

});

//thêm nhân viên
route.post('/infomation/addEmployees',
    async function (req, res, next) {
            const addKey = ["admin.superadmin", "employees.insert"];
            const checkKey = await checkingPermision(addKey, req.session.user); //kiểm tra quyền

            if (!checkKey) return res.json({
                error: notification.NOT_ENOUGH_AUTHORITY
            });
            else return next();
        }, wrap(upload.single('addEmployees')),
        async function (req, res, next) {
            const file = req.file;
            var data = [];
            if (file) {
                try {
                    await xlsx(file.path).then(async (rows) => {
                        rows.shift();
                        data = rows.map(row => [
                            row[0],
                            row[1], //2 Tên
                            row[2],
                            row[12], //4 sinh nhật
                            row[3], //5 ngày vào
                            row[4],
                            row[5],
                            row[6],
                            row[7],
                            row[8],
                            row[9],
                            row[10],
                            row[11],
                            row[13],
                            row[14],
                            row[15] + '|' + row[16] + '|' + row[17] + '|' + row[18], // thường trú
                            row[19] + '|' + row[20] + '|' + row[21] + '|' + row[22],
                            row[23], //cccd
                            row[24], //trường
                            row[25], //ngành
                            row[26], //năm tn
                            row[27], //tuyến
                            row[28], //điểm đón
                            row[29],
                            row[30],
                            row[31]
                        ])
                        //data = rows;
                    })
                } catch {
                    data = {
                        error: "Lỗi đọc file!"
                    };
                }
            } else {
                data = {
                    error: "Lỗi file!"
                };
            }
            //xoá khỏi máy chủ
            fs.rmSync(file.path, {
                force: true,
            });

            //sử lý lấy dữ liệu view
            var headerEmployees = ['ID', 'Name', 'Giới tính', 'Sinh nhật', 'Ngày vào', 'Khối', 'Bậc lương', 'Số bậc', 'Chức vụ', 'Nhóm', 'Xưởng', 'Ca', 'Công việc', 'SĐT1', 'SĐT2', 'Thường trú', 'Tạm trú', 'CCCD', 'Cấc học cao nhất', 'Chuyên ngành', 'Năm tốt nghiệp', 'Tuyến xe', 'Điểm đón', 'RFID', 'ESD', 'Trạng thái']
            data.unshift(headerEmployees)
            return res.json(data);
        });
route.post('/infomation/addEmployeesConfirm', async function (req, res, next) {
    var data = req.body.data;
    var countknex = [0, 0, 0];
    data.shift();
    await Promise.all(data.map(async row => {
        try {
            if (await knex.count('id AS Total').from('employees').where('id_employee', row[0])[0].Total) {
                //update
                await knex('employees')
                    .where('id_employee', row[0])
                    .update({
                        name_employee: row[1],
                        gender: row[2],
                        birthday: row[3],
                        join_date: row[4],
                        class: row[5],
                        rank: row[6],
                        rank_no: row[7],
                        title: row[8],
                        part: row[9],
                        factory: row[10],
                        shift: row[11],
                        job: row[12],
                        phone1: (row[13] == null ? 0 : row[13]),
                        phone2: row[14],
                        residence: row[15],
                        temporary_residence: row[16],
                        cccd: row[17],
                        school: row[18],
                        specialized: row[19],
                        raduation_year: row[20],
                        tuyen_xe: row[21],
                        diem_don: row[22],
                        rfid: row[23],
                        need_esd: row[24],
                        status: row[25],
                        updated_at: knex.fn.now()
                    })
                countknex[1]++;
            } else {
                //insert
                await knex('employees').insert({
                    id_employee: row[0],
                    name_employee: row[1],
                    gender: row[2],
                    birthday: row[3],
                    join_date: row[4],
                    class: row[5],
                    rank: row[6],
                    rank_no: row[7],
                    title: row[8],
                    part: row[9],
                    factory: row[10],
                    shift: row[11],
                    job: row[12],
                    phone1: row[13],
                    phone2: row[14],
                    residence: row[15],
                    temporary_residence: row[16],
                    cccd: row[17],
                    school: row[18],
                    specialized: row[19],
                    raduation_year: row[20],
                    tuyen_xe: row[21],
                    diem_don: row[22],
                    rfid: row[23],
                    need_esd: row[24],
                    status: row[25],
                })
                countknex[0]++;
            }
        } catch {
            countknex[2]++;
        }
    }))

    return res.json(countknex)
})


route.post('/esd/load', async function (req, res) {
    var fType = req.body.fType;
    var fTime = req.body.fTime;
    var fGr = req.body.fGr;
    var fSf = req.body.fSf;

    fGr = fGr.map(val => `'${val}'`)
    fSf = fSf.map(val => `'${val}'`)
    var fType1 = 'dep';
    fType == '1' ? fType1 = 'dep' : fType1 = 'vongtay';
    fTime = fTime.split(' - ').map(t => moment(t, 'MM/DD/YYYY').format('YYYY-MM-DD')); //chuyển đổi thời gian
    var col = []; //Tính số cột dựa vào tg bắt đầu và kết thúc
    for (let curTime = moment(fTime[0]); curTime <= moment(fTime[1]); curTime.add(1, 'days')) {
        col.push(`MAX(CASE WHEN seq = ${moment(curTime).format('YYYYMMDD')} THEN ${fType1} ELSE NULL END) AS D${moment(curTime).format('YYYY_MM_DD')}`)
    }

    var data = await knex.raw(`
        SELECT id_employee,name_employee,part,shift,
        ${col.join()}
        FROM
        (SELECT t1.id, t1.id_employee, t1.name_employee, t1.part, t1.shift, t2.${fType1}, FORMAT(t2.created_at, 'yyyyMMdd') AS seq
        FROM dbo.employees AS t1 LEFT JOIN dbo.ESD AS t2 
        ON t1.id_employee=t2.username AND t2.created_at BETWEEN '${fTime[0]} 00:00:00' AND '${fTime[1]} 23:59:59' 
        WHERE t1.need_esd IN ('${fType}','3') AND t1.part IN (${fGr.join()}) AND t1.shift IN (${fSf.join()}))
        tmp GROUP BY id_employee,name_employee,part,shift
    `);
    res.json(data);
})





module.exports = route;