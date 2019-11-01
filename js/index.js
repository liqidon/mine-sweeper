
// 以面向对象的方式来创建对象
function Mine(tr, td, mineNum) {
    this.tr = tr;  // 行数
    this.td = td;  // 列数
    this.mineNum = mineNum;  // 雷数

    this.squares = [];  // 二维数组用来存储每个方块的信息（位置和内容）
    this.tds = [];  // 存储所有的单元格的DOM
    this.surplusMine = mineNum;  // 剩余雷的数量
    this.allRight = false;  // 右击标记的是否全是雷，判断游戏是否成功

    this.parent = document.querySelector('.gameBox');
    this.mineNumDom = document.querySelector('.mineNum');
}

// 生成含有n个不重复的数字的数组
Mine.prototype.randomNum = function () {
    var square = new Array(this.tr * this.td);  // 生成格子总数大小的数组
    for (var i = 0; i < square.length; i++) {
        square[i] = i;
    }

    square.sort(function () {  // 将数组中的数字进行随机排序
        return 0.5 - Math.random();
    });

    return square.slice(0, this.mineNum);  // 截取雷数长度的数组
}

// 初始方法
Mine.prototype.init = function () {
    
    var rn = this.randomNum();  // 雷在格子里的位置
    var n = 0;  // 用来找到对应的索引
    for (var i = 0; i < this.tr; i++) {
        this.squares[i] = [];
        for (var j = 0; j < this.td; j++) {
            // 取一个方块在数组中的数据使用行和列的形式去取，找方块周围的方块时使用坐标形式取，行和列形式与坐标形式刚好相反。
            if (rn.indexOf(++n) != -1) {  // 此方块为雷
                this.squares[i][j] = {
                    type: 'mine',
                    x: j,
                    y: i
                };
            } else {  // 此块为数字或空
                this.squares[i][j] = {
                    type: 'number',
                    x: j,
                    y: i,
                    value: 0
                };
            }
        }
    }
    this.updateNum();
    this.createDom();
    // 取消默认事件
    this.parent.oncontextmenu = function (e) {
        e.preventDefault();
    }
    
    // 剩余的雷数
    this.mineNumDom.innerHTML = this.surplusMine;
}

// 创建方格
Mine.prototype.createDom = function () {
    var This = this;
    var table = document.createElement('table');

    for (var i = 0; i < this.tr; i++) {
        var domTr = document.createElement('tr');
        this.tds[i] = [];

        for (var j = 0; j < this.td; j++) {
            var domTd = document.createElement('td');        
            this.tds[i][j] = domTd;  // 将所有创建的dom加到数组中

            // 展示雷和数字
            domTd.pos = [i, j];  // 将格子对应的行和列的值放到dom上，方便取
            domTd.onmousedown = function () {
                This.play(event, this);  // This为实例对象，this为domTd
            };
            // if (this.squares[i][j].type == 'mine') {
            //     domTd.className = 'mine';
            // } else if (this.squares[i][j].type == 'number') {
            //     domTd.innerHTML = this.squares[i][j].value;
            // }
            
            domTr.appendChild(domTd);
        }

        table.appendChild(domTr);
    }
    
    this.parent.innerHTML = '';  // 避免多次创建
    this.parent.appendChild(table);
}

// 找格子周围的八个方格
Mine.prototype.getAround = function (square) {
    var x = square.x;
    var y = square.y;
    var result = [];  // 找到的格子的坐标

    // 通过坐标循环九宫格
    for (var i = x - 1; i <= x + 1; i++) {
        for (var j = y - 1; j <= y + 1; j++) {
            if (i < 0 || j < 0 || i >= this.td || j >= this.tr || (i == x && j ==y) || this.squares[j][i].type == 'mine') {
                continue;
            }
            result.push([j, i]);  // 以行和列的形式返回，因为需要取数据
        }
    }
    return result;
}

// 更新雷周围的数字
Mine.prototype.updateNum = function () {
    for (var i = 0; i < this.tr; i++) {
        for (var j = 0; j < this.td; j++) {
            if (this.squares[i][j].type == 'number') {
                continue;
            }
            var num = this.getAround(this.squares[i][j]);

            for (var k = 0; k < num.length; k++) {
                this.squares[num[k][0]][num[k][1]].value += 1;
            }
        }
    }
}

Mine.prototype.play = function (e, obj) {
    var This = this;
    // 点击左键
    if (e.which == 1 && obj.className != 'flag') {
        var curSquare = this.squares[obj.pos[0]][obj.pos[1]];
        var cl = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
        if (curSquare.type == 'number') {
            obj.innerHTML = curSquare.value;
            obj.className = cl[curSquare.value];
            if (curSquare.value == 0) {
                obj.innerHTML = null;
                // 扩散算法
                function getAllZero(square) {
                    var around = This.getAround(square);

                    for (var i = 0; i < around.length; i++) {
                        var x = around[i][0];
                        var y = around[i][1];
                        This.tds[x][y].className = cl[This.squares[x][y].value];
                        if (This.squares[x][y].value == 0) {
                            if (!This.tds[x][y].check) {  // 判断此格子是否重复判断过
                                This.tds[x][y].check = true;
                                getAllZero(This.squares[x][y]);
                            }    
                        } else {
                            This.tds[x][y].innerHTML = This.squares[x][y].value;
                        }
                    }
                }
                getAllZero(curSquare);
            }
        } else {
            this.gameOver(obj);
            // obj.className = 'mine';
        }
    }
    // 点击右键
    if (e.which == 3) {
        // 点击一次标记，两次取消，标记全部游戏成功
        if (obj.className && obj.className != 'flag') {
            return;
        }
        obj.className = obj.className == 'flag' ? '' : 'flag';
        if (this.squares[obj.pos[0]][obj.pos[1]].type == 'mine') {
            this.allRight = true;
        } else {
            this.allRight = false;
        }

        if (obj.className == 'flag') {
            this.mineNumDom.innerHTML = --this.surplusMine;
        } else {
            this.mineNumDom.innerHTML = ++this.surplusMine;
        }

        if (this.surplusMine == 0) {
            if (this.allRight) {
                alert('success');
            } else {
                alert('failed');
                this.gameOver();
            }
        }
    }
}

Mine.prototype.gameOver = function (clickTd) {
    // 显示所有的雷，取消点击事件，给点中的雷标记
    for (var i = 0; i < this.tr; i++) {
        for (var j = 0; j < this.td; j++) {
            if (this.squares[i][j].type == 'mine') {
                this.tds[i][j].className = 'mine';
            }
            this.tds[i][j].onmousedown = null;
        }
    }
    if (clickTd) {
        clickTd.style.borderColor = '#ff0000';
    }

}

// button功能
var btns = document.querySelectorAll('button');
var mine = null;
var ln = 0;
var arr = [[9, 9, 10], [16, 16,40], [28, 28, 99]];

for (let i = 0; i < btns.length - 1; i++) {
    btns[i].onclick = function () {
        btns[ln].className = '';
        this.className = 'active';
        mine = new Mine(...arr[i]);
        mine.init();
        ln = i;
    }
}
btns[0].onclick();
btns[3].onclick = function () {
    mine.init();
}

