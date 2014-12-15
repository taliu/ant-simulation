/*! ant - v1.0.0 - 2014-12-03
 * https://github.com/taliu/ant
 * Copyright (c) 2014 taliu; Licensed MIT */

/*global window */
/*global $ */

//表格行和列
var ROW = 30,
    COL = 30,
    //蚂蚁洞位置
    HOME_ROW = 0, //parseInt(ROW/2),
    HOME_COL = 0,
    //食物位置
    DESTINATION_ROW = ROW - 1,
    DESTINATION_COL = COL - 1,
    SPEED = 0, //蚂蚁速度
    //路径颜色
    PATH_COLOR = "green",
    OPACITY_MAX = 10000, //透明度最最大值
    BASE_TOTAL = 100,
    ANT_TOTAL = 10; //蚂蚁总数
var AntStatus = {
    search: 1, //寻找中
    found: 2, //已经到达目的地
    success: 4 //已经回到蚂蚁洞
};
var Direction = {
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    //斜对角
    upRight: 3839,
    rightDown: 3940,
    downLeft: 4037,
    leftUp: 3738
};
var antList = []; //蚂蚁队列
var minStep = 0;
var addStep = 10;

function createTable(rowNum, colNum) {
    var $table = $("<table>");
    for (var r = 0; r < rowNum; r++) {
        var $tr = $("<tr>");
        for (var c = 0; c < colNum; c++) {
            var $td = $("<td>");
            var opacityValue = 1; //透明度 
            $td.attr({
                id: r + "_" + c,
                row: r,
                col: c,
                value: opacityValue,
                colors: "",
                obstacle: "no", //是否为障碍物：no,yes
                destination: "no" //是不是蚂蚁寻找的目的地：no,yes
            });
            $td.css({
                'opacity': opacityValue / OPACITY_MAX
            });
            $td[0].style.backgroundColor = PATH_COLOR;
            $tr.append($td);
        }
        $table.append($tr);
    }
    return $table;
}


function changeTdColor(seletor, color) {
    var $td = $(seletor);
    if (color) { //color有值，则设置td的颜色为color，如果没有值，则从colors中获取颜色值来设置td的颜色（也就是还原颜色值）
        var colors = $td.attr("colors");
        var backgroundColor = $td[0].style.backgroundColor;
        if (colors) {
            colors = colors + "," + backgroundColor;
        } else {
            colors = backgroundColor;
        }
        $td.attr("colors", colors);
        $td[0].style.backgroundColor = color;
        $td.css({
            'opacity': 1
        });
    } else {
        var colorArr = $td.attr("colors").split(",");
        color = colorArr.pop() || PATH_COLOR;
        $td[0].style.backgroundColor = color;
        if (color === PATH_COLOR) {
            $td.css({
                'opacity': +$td.attr("value") / OPACITY_MAX
            });
        }
        $td.attr("colors", colorArr.join(","));
    }
}

function addTdValue(seletor, val) {

    var $td = $(seletor);
    if ($td.attr("home") === "yes") {
        return;
    }
    $td.attr("value", val + parseInt($td.attr("value")));
}

function isDestinationTd(seletor) {
    var val = $(seletor).attr("destination");
    return val === "yes";
}

function getRandomNum(limit) {
    return Math.random() * limit;
}


function Ant(color) {

    //初始化ant值
    this.init = function(color) {
        this.color = color;
        this.row = HOME_ROW;
        this.col = HOME_COL;
        this.status = AntStatus.search;
        this.paths = [];
        this.speed = SPEED * 1.0; //每1000帧跑一次
        this.frameCount = 0;
        this.varyStep = 1;
    };
    //color,row,col,status:"search,found,success",paths=[]
    this.init(color);
    this.canRun = function() {
        this.frameCount++;
        if (this.frameCount >= this.speed) {
            this.frameCount = 0;
            return true;
        }
        return false;
    };
    this.run = function() {
        if (this.status === AntStatus.success) {
            this.init(this.color);
        }

        var tdId = this.getIdSeletor();
        //还原当前td的颜色
        changeTdColor(tdId);
        //移动到下一个位置
        var pos = this.getNextPos();
        if (!pos) {
            console.log(pos, this);
        }

        if (this.status === AntStatus.search) {
            //保存当前位置
            this.paths.push({
                row: this.row,
                col: this.col
            });
        }
        this.row = pos.row;
        this.col = pos.col;


        //设置当前td的颜色
        tdId = this.getIdSeletor();
        changeTdColor(tdId, this.color);
        //增加当前td的value值
        if (this.status === AntStatus.found) {
            addTdValue(tdId, this.varyStep);
        } else {
            addTdValue(tdId, 0);
        }
        //查看是否到了目的地  
        if (isDestinationTd(tdId)) {
            this.status = AntStatus.found;
            this.paths = trimPathArr(this.paths);
            if (minStep) { //积累最小的路径
                if (this.paths.length < minStep) {
                    this.varyStep = (minStep - this.paths.length) * 10 + addStep;
                    addStep += this.varyStep;
                    minStep = this.paths.length;
                    console.log("最段距离:", minStep, "增加量：", addStep);

                } else {
                    if (Math.abs(this.paths.length - minStep) < 5) {
                        this.varyStep = 1;
                    }
                }
            } else {
                minStep = this.paths.length;
                this.varyStep = 1;
            }
            // console.log("找到食物时共用", this.paths.length,"步")
        }
        //判断是否找到食物成功回到蚂蚁洞中
        if (this.status === AntStatus.found && this.isHome()) {
            this.status = AntStatus.success;
        }
        $("#pathsMsg").text(minStep);
    };
    //获取下一个位置
    this.getNextPos = function() {
        if (this.status === AntStatus.found) {
            return this.paths.pop();
        } else { //this.status === AntStatus.search
            var vals = [];
            for (var key in Direction) {
                var val = this.getPosVal(Direction[key]);
                if (val) {
                    vals.push(val);
                }
            }

            if (vals.length === 0) {
                var pos = this.paths[this.paths.length - 1];
                var tdId = this.getIdSeletor(pos.row, pos.col);
                return {
                    row: pos.row,
                    col: pos.col,
                    value: +$(tdId).attr("value")
                };
            }

            var total = this.getTotal(vals, vals.length - 1); //有效的posVal的value值总和

            //总和设定为大于BASE_TOTAL次会更精确？
            total += BASE_TOTAL;

            //随机产生一个小于total数
            var randomNum = getRandomNum(total);
            //按照value值占total的比例，以它他为概率，来选择一个posVal
            for (var i = 0; i < vals.length; i++) {
                if (vals[i]) {
                    if (this.getTotal(vals, i - 1) <= randomNum && randomNum < this.getTotal(vals, i)) {
                        return vals[i];
                    }
                }
            }

            //总和设定为大于BASE_TOTAL次时的补充：如果上面没有产生有效的方向，则以平均的概率选择其中一个
            var index = Math.floor(getRandomNum(vals.length));
            return vals[index];
        }

    };
    this.getTotal = function(vals, n) {
        var total = 0;
        for (var i = 0; i < vals.length && i <= n; i++) {
            total += vals[i].value;
        }
        return total;
    };
    this.getPosVal = function(direction) {
        var row = this.row,
            col = this.col;
        switch (direction) { //up38,down40,left37,right39
            case Direction.up:
                row -= 1;
                break;
            case Direction.down:
                row += 1;
                break;
            case Direction.left:
                col -= 1;
                break;
            case Direction.right:
                col += 1;
                break;
            case Direction.upRight:
                col += 1;
                row -= 1;
                break;
            case Direction.rightDown:
                col += 1;
                row += 1;
                break;
            case Direction.downLeft:
                col -= 1;
                row += 1;
                break;
            case Direction.leftUp:
                col -= 1;
                row -= 1;
                break;
            default:
                break;
        }
        if (!(row >= 0 && row < ROW)) {
            row = this.row;
        }
        if (!(col >= 0 && col < COL)) {
            col = this.col;
        }

        if (this.row === row && this.col === col) { //还在原来的位置，没发朝该方向移动，则返回null
            return null;
        }
        var len = Math.min(COL, ROW);
        for (var i = 1; i < len; i++) {
            var pos = this.paths[this.paths.length - i];
            if (pos && row === pos.row && col === pos.col) { //前len步刚走过的地方，就不要再走了
                if (i < len / 2) { //前面len/2一定不回头
                    return null;
                } else {
                    if (getRandomNum(2) >= 1) { //后面两步len/2的概率不回头
                        return null;
                    }
                }

            }
        }

        var tdId = this.getIdSeletor(row, col);
        //如果是障碍物
        if ($(tdId).attr("obstacle") === "yes") {
            return null;
        }
        return {
            row: row,
            col: col,
            value: +$(tdId).attr("value")
        };

    };
    this.getIdSeletor = function(row, col) {
        row = row || this.row;
        col = col || this.col;
        var tdId = "#" + row + "_" + col;
        return tdId;
    };
    this.isHome = function() {
        return this.row === HOME_ROW && this.col === HOME_COL;
    };
    //消除重复的路径
    function trimPathArr(arr) {

        for (var i = 0; i < arr.length; i++) {
            if (arr[i]) {
                var index = lastIndexOf(arr, i);
                if (index !== -1) {
                    for (var j = i + 1; j <= index; j++) {
                        arr[j] = null;
                    }
                }
            }
        }
        var buff = [];
        for (i = 0; i < arr.length; i++) {
            if (arr[i]) {
                buff.push(arr[i]);
            }
        }
        console.log("路径优化前:", arr.length, "优化后:", buff.length);
        return buff;
    }

    function lastIndexOf(arr, index) {
        for (var i = arr.length; i--;) {
            if (arr[i] && i > index) {
                if (arr[i].row === arr[index].row && arr[i].col === arr[index].col) {
                    return i;
                }
            }
        }
        return -1;
    }


}
var requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

function run() {
    for (var i = 0; i < antList.length; i++) {
        var ant = antList[i];
        if (ant.canRun()) {
            ant.run();
        }
    }
    requestAnimFrame(run);
}

function createAnts(num) {
    antList.push(new Ant("red"));
    var t = setInterval(function() {
        if (antList.length >= num) {
            clearInterval(t);
            return;
        }
        var arr = ["red", 'yellow', "blue"];
        var color = arr[parseInt(getRandomNum(arr.length))];
        antList.push(new Ant(color));
    }, 1000);
}



function main() {
    requestAnimFrame(run);
    createAnts(ANT_TOTAL);
}

$(function() {

    $("#begin").on("click", function() {
        if (!$("table")[0]) {
            $("#createTable").click();
        }
        $("#antSpeed").change();
        $("#antNum").change();

        $("#setting").hide();
        $("#showMsg").show();
        main();

    });

    $("#createTable").on("click", function() {
        $("table").remove();
        ROW = parseInt($("#tableRow").val()) || 30;
        COL = parseInt($("#tableCol").val()) || 30;
        $("#tableRow").val(ROW);
        $("#tableCol").val(COL);
        $("#tableSize").text(ROW + "x" + COL);
        var $table = createTable(ROW, COL);
        $("body").append($table);
        //蚂蚁洞位置
        HOME_ROW = 0;
        HOME_COL = 0;
        //食物位置
        DESTINATION_ROW = ROW - 1;
        DESTINATION_COL = COL - 1;
        $("#" + DESTINATION_ROW + "_" + DESTINATION_COL).css({
            'opacity': 1
        }).attr({
            "destination": "yes",
            "value": OPACITY_MAX
        }).text("食");
        $("#" + HOME_ROW + "_" + HOME_COL).css({
            'opacity': 1
        }).attr({
            "home": 'yes',
            "value": OPACITY_MAX
        }).text("洞");

        $("td").on("click", function() {
            var val = $("#select").val();
            var $td = $(this);
            if (val === 1) { //设置障碍物
                if ($td.attr("destination") !== 'yes' && $td.attr("home") !== 'yes') {
                    if ($td.attr("obstacle") === 'yes') {
                        $td.attr("obstacle", "no");
                        $td.css({
                            'opacity': 1 / OPACITY_MAX
                        });
                        $td[0].style.backgroundColor = PATH_COLOR;
                    } else {
                        $td.attr("obstacle", 'yes');
                        $td.css({
                            'opacity': 1
                        });
                        $td[0].style.backgroundColor = 'black';
                    }
                }

            } else if (val === 2) { //设置蚂蚁洞位置
                if ($td.attr("obstacle") === 'yes') {
                    return;
                }
                $("#" + HOME_ROW + "_" + HOME_COL).css({
                    'opacity': 1 / OPACITY_MAX
                }).attr({
                    "home": 'no',
                    "value": 1
                }).text("");
                HOME_ROW = +$td.attr("row");
                HOME_COL = +$td.attr("col");
                $("#" + HOME_ROW + "_" + HOME_COL).css({
                    'opacity': 1
                }).attr({
                    "home": 'yes',
                    "value": OPACITY_MAX
                }).text("洞");

            } else if (val === 3) { //设置食物位置
                if ($td.attr("obstacle") === 'yes') {
                    return;
                }
                $("#" + DESTINATION_ROW + "_" + DESTINATION_COL).css({
                    'opacity': 1 / OPACITY_MAX
                }).attr({
                    "destination": "no",
                    "value": 1
                }).text("");
                DESTINATION_ROW = +$td.attr("row");
                DESTINATION_COL = +$td.attr("col");
                $("#" + DESTINATION_ROW + "_" + DESTINATION_COL).css({
                    'opacity': 1
                }).attr({
                    "destination": "yes",
                    "value": OPACITY_MAX
                }).text("食");
            }
        });
    });

    $("#antSpeed").on("keyup", function() {
        var v = parseInt(this.value);
        if (v > 5 && v < 0) {
            v = 5;
        }
        SPEED = (5 - v) * 16;
    }).on("change", function() {
        this.value = 5 - (SPEED / 16);
        $("#antSpeedMsg").text(this.value);
    });

    $("#antNum").on("keyup", function() {
        ANT_TOTAL = parseInt(this.value) || 10;
    }).on("change", function() {
        this.value = ANT_TOTAL;
        $("#antNumMsg").text(ANT_TOTAL);
    });



});
