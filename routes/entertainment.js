const express = require('express');
var route = express.Router();
const {
    wrap
} = require('async-middleware');
const {
    isAuthenticated,
    checkingPermision,
    getEmployee
} = require('../features/authentication');


const multer = require("multer");
// SET STORAGE
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, Date.now() + '_' + file.originalname);
    }
})
var upload = multer({
    storage: storage
})
const fs = require('fs');
const NodeID3 = require('node-id3')
var knex = require('../db/db');
const path = require('path');
var moment = require('moment');



route.get("/sudoku", wrap(isAuthenticated), function (req, res, next) {
    res.locals.title = 'Sudoku'
    res.render('./pages/entertainment/sudoku');
});

route.get("/fileManager", wrap(isAuthenticated), function (req, res, next) {
    res.locals.title = 'Quản lý tập tin'
    res.render('./pages/entertainment/fileManager');
});

route.get("/chat", wrap(isAuthenticated), function (req, res, next) {
    res.locals.title = 'Chém gió'
    res.render('./pages/entertainment/chat');
});
//route.post('/fileManager/upload', wrap(isAuthenticated), wrap(uploadFile))

route.post('/fileManager/paging', wrap(isAuthenticated), async function (req, res, next) {
    var search = req.body.search;
    var limit = req.body.limit;
    var paging = req.body.paging;
    //lấy tổng số dòng trong bảng khi chưa lọc
    var total_records = await knex
        .count('id AS Total')
        .from('files')
        .where('file_name', 'like', `%${search}%`);
    //lấy dữ liệu
    var data = await knex.select()
        .from('files')
        .where('file_name', 'like', `%${search}%`)
        .orderBy('id', 'asc')
        .limit(limit, {
            skipBinding: true
        })
        .offset((paging - 1) * limit)

    data = data.map(data => ({
        id: data.id,
        name: data.file_name,
        link: data.file_url,
        type: data.file_type,
        size: calculatorSize(data.file_size),
        date: moment(data.created_at).format('HH:mm DD/MM/YYYY')
    }));

    res.json({
        'data': data,
        'total': total_records[0].Total,
        'limit': limit * 1,
        'page': paging * 1

    })
})

route.post('/fileManager/delete', async function (req, res, next) {
    const id_file = req.body.id_file;
    const delKey = ["admin.superadmin", "files.delete"];
    const checkKey = await checkingPermision(delKey, req.session.user); //kiểm tra quyền


    if (checkKey) {
        if (!await knex.count('id AS Total').from('files').where('id', id_file))
            return res.json({
                error: "Không tồn tại tập tin"
            });

        var data = await knex.select('file_url')
            .from('files')
            .where('id', id_file)
            .first();

        //xoá khỏi máy chủ
        fs.rmSync(path.join(appRoot, 'public', data.file_url), {
            force: true,
        });
        //xoá khỏi csdl
        await knex('files')
            .where('id', id_file)
            .del()
        return res.json({
            success: "Đã xoá"
        });
    } else {
        return res.json({
            error: "Bạn không đủ quyền"
        });
    }

});



//route.post('/fileManager/test', wrap(names));

//Uploading multiple files 
route.post('/fileManager/upload_files', async (req, res, next) => {
        const addKey = ["admin.superadmin", "files.insert"];
        const checkKey = await checkingPermision(addKey, req.session.user); //kiểm tra quyền

        if (checkKey) return next();
        else return res.json({
            error: "Bạn không đủ quyền"
        })

    },
    wrap(upload.array('myFiles', 20)),
    async (req, res, next) => {
        const files = req.files
        if (!files) {
            const error = new Error('Please choose files')
            error.httpStatusCode = 400
            return next(error)
        }
        var employee = await getEmployee(req.session.user);


        //ghi dữ liệu vào bảng
        await Promise.all(files.map(async f => await knex('files').insert({
            file_name: f.originalname,
            file_url: f.path.slice(6).replaceAll('\\', '\/'),
            file_type: f.mimetype,
            file_size: f.size,
            employee_id: employee.id_employee
        })))

        res.send(files);
    })

route.get("/audio", wrap(isAuthenticated), async function (req, res, next) {
    var folderMp3 = 'public/audio/'

    var listMp3 = fs.readdirSync(folderMp3, {
            withFileTypes: true
        })
        .filter(item => !item.isDirectory())
        .map(item => ({
            [item.name]: NodeID3.read(item.path + item.name)
        }))

    res.locals.listMp3 = listMp3;
    res.locals.title = 'Nghe nhạc';
    res.render('./pages/entertainment/audio');
});

route.get(["/", "/findNumber"], wrap(isAuthenticated), function (req, res, next) {
    res.locals.title = 'Tìm số'
    res.render('./pages/entertainment/findNumber');
});












const calculatorSize = (size) => {
    if (size < 1024) return size + ' B';
    else if (size < 1048576) return Math.round(size / 1024 * 100) / 100 + ' KB';
    else return Math.round(size / 1024 / 1024 * 100) / 100 + ' MB';
}

module.exports = route;