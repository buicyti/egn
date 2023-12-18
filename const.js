const nav = [{
    name: 'Home',
    url: '/',
    icon: 'fa-solid fa-house-laptop',
    children: [{
        name: 'Dashboard',
        url: '/dashboard',
        icon: 'fa-solid fa-chart-line'
    }]
}, {
    name: 'Monitoring',
    url: '',
    icon: 'fa-solid fa-desktop',
    children: [{
        name: 'Printer',
        url: '/monitoring/printer',
        icon: 'fa-solid fa-money-bill-trend-up'
    }, {
        name: 'Chip mouter',
        url: '/monitoring/chip',
        icon: 'fa-solid fa-pen-clip'
    }, {
        name: 'Nhiệt độ - độ ẩm',
        url: '#',
        icon: 'fa-solid fa-snowflake',
        children: [{
            name: 'Xưởng',
            url: '/monitoring/th/factory',
            icon: 'fa-solid fa-temperature-half'
        }, {
            name: 'Tủ bảo quản linh kiện',
            url: '/monitoring/th/lkdt',
            icon: 'fa-solid fa-temperature-quarter'
        }]
    }, {
        name: 'Khác',
        url: '#',
        icon: 'fa-solid fa-snowflake',
        children: [{
            name: 'Lưu lượng khí nén',
            url: '/monitoring/other/factory',
            icon: 'fa-solid fa-temperature-half'
        }, {
            name: 'Bật/tắt điện xưởng',
            url: '/monitoring/other/electric',
            icon: 'fa-solid fa-temperature-quarter'
        }]
    }]
}, {
    name: 'Employees',
    url: '/employees',
    icon: 'fa-solid fa-users',
    children: [{
        name: 'Thông tin nhân viên',
        url: '/employees/infomation',
        icon: 'fa-solid fa-user-tie'
    }, {
        name: 'ESD (Đo tĩnh điện)',
        url: '/employees/esd',
        icon: 'fa-solid fa-e'
    }, {
        name: 'Quản lý (Admin)',
        url: '/employees/HRM',
        icon: 'fa-solid fa-user-secret'
    }]
}, {
    name: 'Entertainment',
    url: '/entertainment',
    icon: 'fa-solid fa-synagogue',
    children: [{
        name: 'Quản lý tập tin',
        url: '/entertainment/fileManager',
        icon: 'fa-solid fa-file'
    }, {
        name: 'Kiểm tra mắt',
        url: '/entertainment/findNumber',
        icon: 'fa-solid fa-eye'
    }, {
        name: 'SUDOKU',
        url: '/entertainment/sudoku',
        icon: 'fa-solid fa-hashtag'
    }, {
        name: 'Thông lỗ tai',
        url: '/entertainment/audio',
        icon: 'fa-solid fa-music'
    }, {
        name: 'Chém gió',
        url: '/entertainment/chat',
        icon: 'fa-brands fa-rocketchat'
    }]
}]

//danh sách các thông báo
const notification = {
    NOT_ENOUGH_AUTHORITY: 'Bạn không đủ quyền hạn để thực hiện hành động này',
    UPDATE_SUCCESS: 'Cập nhật thành công',
    NOT_EXIST_ACCOUNT: 'Lỗi! Không tồn tại tài khoản này.'
}

//liệt kê các quyền truy cập
var listPermission = {
    admin: ['superadmin'],
    users: ['active', 'update', 'delete'],
    files: ['view', 'insert', 'update', 'delete'],
    employees: ['view', 'insert', 'update', 'delete'],
}


module.exports = {
    nav,
    notification,
    listPermission
};