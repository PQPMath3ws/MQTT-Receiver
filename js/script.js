function getData() {
    $server = document.getElementById("hostMQTT").value;
    $port = document.getElementById("portMQTT").value;
    $user = document.getElementById("userMQTT").value;
    $pwd = document.getElementById("pwdMQTT").value;
    $timeout = document.getElementById("timeoutMQTT").value;
    $id = generateUserId();
    if(($server != null) && ($port != null) && ($user != null) && ($pwd != null)) {
        if($timeout == null) {
            clientConnect($server, $port, $user, $pwd, 60, $id);
        }
        else {
            clientConnect($server, $port, $user, $pwd, $timeout, $id);
        }
    }
}
function generateUserId() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for(var i = 0; i < 20; i++) {
        result = characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function clientConnect(server, port, user, pwd, timeout, id) {
    client = new Paho.MQTT.Client(server, Number(port), id);
    client.onConnectionLost = connectionLost;
    client.onMessageArrived = messageArrived;
    client.connect({
        useSSL: true,
        timeout: Number(timeout),
        userName: user,
        password: pwd,
        onSuccess: sucess,
        onFailure: failure
    });
}
function sucess() {
    client.subscribe("#");
    alert("Conectado com Sucesso!");
    document.title = "CloudMQTT - Tópicos";
    var topics_div = document.getElementById("topics-div");
    resizeDiv("swipe", 350, topics_div.offsetHeight);
    window.mySwipe.setup(document.getElementById('slider'));
    window.mySwipe.slide(1, 500);
    document.body.appendChild(logoutBTN);
}
function failure(invocationContext, errorCode, errorMessage) {
    alert("Não foi possível conectar ao server WebSocket, cheque suas informações e/ou seu firewall e tente novamente!");
}
function connectionLost(responseObject) {
    if(responseObject.errorCode == 0) {
        alert("Desconectado com Sucesso! ;-)");
    } else {
        alert("Conexão Perdida - Favor conectar novamente! :'(");
    }
    document.title = "CloudMQTT - Log In";
    var login_div = document.getElementById("login-div");
    resizeDiv("swipe", 350, login_div.offsetHeight);
    window.mySwipe.setup(document.getElementById('slider'));
    document.body.removeChild(logoutBTN);
    window.mySwipe.slide(0, 500);
}
function messageArrived(message) {
    var topics_content = document.getElementById("topics-content").children;
    var topic_content_title = document.getElementById("topic-name-title");
    var count = 0;
    for(var i = 0; i < topics_content.length; i++) {
        if(topics_content[i].textContent != message.destinationName) {
            count++;
        }
    }
    if(count == topics_content.length) {
        addTopics(message.destinationName, message.payloadString);
        var topics_div = document.getElementById("topics-div");
        resizeDiv("swipe", 350, topics_div.offsetHeight);
        window.mySwipe.setup(document.getElementById('slider'));
    }
    if((topic_content_title != null) && (topic_content_title.textContent == message.destinationName)) {
        var date = new Date();
        chart_Canvas.data.labels.push(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
        chart_Canvas.data.datasets.forEach((dataset) => {
            dataset.data.push(message.payloadString);
        });
        chart_Canvas.update();
        updateTable(message.payloadString);
    }
}
function addTopics(name, value) {
    var whatIsAdded = document.createElement("button");
    whatIsAdded.textContent = name;
    whatIsAdded.className = "topic-btn";
    whatIsAdded.onclick = function() {
        document.title = "CloudMQTT - " + name;
        addRemoveDivContent(name, value);
        createChart(name, value);
        var topic_div = document.getElementById("topic-content");
        resizeDiv("swipe", 800, topic_div.offsetHeight);
        window.mySwipe.setup(document.getElementById('slider'));
        window.mySwipe.slide(2, 500);
    };
    var whereAdd = document.getElementById("topics-content");
    whereAdd.appendChild(whatIsAdded);
}
function addRemoveDivContent(name, value) {
    var divContent = document.getElementById("topic-content");
    var divChartValues = [];
    if(divContent.children.length != 0) {
        divContent.innerHTML = "";
    }
    var topicSpan = document.createElement("span");
    var topicTitle = document.createElement("h2");
    topicTitle.id = "topic-name-title";
    topicTitle.className = "CloudMQTT_Title";
    topicTitle.textContent = name;
    topicSpan.appendChild(topicTitle);
    var divChart = document.createElement("div");
    divChart.style.width = "440px";
    divChart.style.marginTop = "10px";
    divChart.style.marginLeft = "20px";
    divChart.style.marginRight = "20px";
    divChart.style.paddingBottom = "30px";
    var chartCanvas = document.createElement("canvas");
    chartCanvas.id = "chart-Canvas";
    chartCanvas.style.width = "440px";
    chartCanvas.style.height = "320px";
    var divLastValue = document.createElement("div");
    divLastValue.id = "div-Last-Value";
    var titleLastValue = document.createElement("h3");
    titleLastValue.textContent = "Últimos 10 valores:";
    var backBTN = document.createElement("button");
    backBTN.className = "topic-btn";
    backBTN.textContent = "Voltar";
    backBTN.onclick = function() {
        document.title = "CloudMQTT - Tópicos"
        var topics_div = document.getElementById("topics-div");
        resizeDiv("swipe", 350, topics_div.offsetHeight);
        window.mySwipe.setup(document.getElementById('slider'));
        window.mySwipe.slide(1, 500);
    };
    divChart.appendChild(chartCanvas);
    divLastValue.appendChild(titleLastValue);
    generateTable(divLastValue, value);
    divContent.appendChild(topicSpan);
    divContent.appendChild(divChart);
    divContent.appendChild(divLastValue);
    divContent.appendChild(backBTN);
    divContent.appendChild(topicsRowId);
}
function resizeDiv(divClassName, divPixelWidth, divPixelHeight) {
    elements = document.getElementsByClassName(divClassName);
    for(i = 0; i < elements.length; i++) {
        elements[i].style.width = (divPixelWidth + "px");
        elements[i].style.height = (divPixelHeight + "px");
    }
}
function createChart(name, value) {
    var date = new Date();
    var canvasChart = document.getElementById("chart-Canvas").getContext('2d');
    chart_Canvas = new Chart(canvasChart, {
        type: 'line',
        data: {
            labels: [date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()],
            datasets: [{
                label: name + '\'s valor',
                data: [value],
                backgroundColor: ['rgba(10, 10, 255, 0.8)'],
                borderColor: ['rgba(10, 10, 255, 0.8)'],
                fill: false
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: false
                    }
                }]
            }
        }
    });
}
function generateTable(divToInsert, lastValue) {
    var date = new Date();
    var table = document.createElement("table");
    table.id = "table-last-values";
    for(var i = 0; i < 11; i++) {
        var newRow = table.insertRow(i);
        var cell1 = newRow.insertCell(0);
        var cell2 = newRow.insertCell(1);
        if(i == 0) {
            cell1.innerHTML = "Hora";
            cell2.innerHTML = "Valor";
        }
        else if(i == 10) {
            cell1.innerHTML = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            cell2.innerHTML = lastValue;
        }
        else {
            cell1.innerHTML = "Sem Valor";
            cell2.innerHTML = "Sem Valor";
        }
    }
    divToInsert.appendChild(table);
}
function updateTable(message) {
    var date = new Date();
    var table = document.getElementById("table-last-values");
    for(var i = 1; i < 11; i++) {
        for(var j = 0; j < 2; j++) {
            if(i != 10) {
                table.rows[i].cells[j].innerHTML = table.rows[i + 1].cells[j].innerHTML;
            } else {
                if(j == 0) {
                    table.rows[i].cells[j].innerHTML = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                } else {
                    table.rows[i].cells[j].innerHTML = message;
                }
            }
        }
    }
}
window.mySwipe = new Swipe(document.getElementById('slider'));
var logoutBTN = document.createElement("button");
logoutBTN.id = "logout-btn";
logoutBTN.textContent = "Desconectar";
logoutBTN.onclick = function() {
    client.disconnect();
}
var chart_Canvas = [];
var topicsRowId = document.createElement("div");
topicsRowId.id = "topics-Row-Value";