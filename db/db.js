//var sql = require("mssql")
const {
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_NAME,
    DATABASE_USER,
    DATABASE_PASSWORD
} = process.env;

let knex = require('knex')({
    client: 'mssql',
    connection: {
        server: DATABASE_HOST,
        user: DATABASE_USER,
        password: DATABASE_PASSWORD,
        database: DATABASE_NAME,
        port: parseInt(DATABASE_PORT || 1433)
    }
})

knex.raw("SELECT 1").then(() => {
    console.log("Kết nối đến cơ sở dữ liệu thành công")
}).catch((e) => {
    console.log("Kết nối đến cơ sở dữ liệu thất bại");
    console.error(e);
});

module.exports = knex;