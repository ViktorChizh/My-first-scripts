// ==UserScript==
// @name         Tabletka
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Сокращает список аптек до заданных вариантов
// @author       ChVL
// @match        https://tabletka.by/result*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tabletka.by
// @icon         C:\Логотип оланы.png
// @grant        none
// ==/UserScript==

(function(){
// Надо вбить в массив нужные адреса ближайших аптек и изменить количество arr_near[i] в функции sort().
// можно было бы через кнопку настройки (с чекбоксом, т.к. без него все запускается при загрузке) и prompt(), но пока не знаю как сохранять введенные значения в тампермонкей.

    let arr_near = ["ул. Жукова, 1, к. 1", "ул. Жукова, 7", "ул. Гвардейская, 9", "ул. Гвардейская, 6А", "ул. Гвардейская, 5", "ул. Рябиновая, 1А"];
//G    let arr_near = ["Махновича, 14", "Машерова, 76", "Сальникова, 14", " Махновича, 36", "Махновича, 21"];
//М    let arr_near = ["ул. Октябрьской революции, 11", "ул. Луцкая, 46", "ул. Волгоградская, 19", "ул. Волгоградская, 38А", "ул. Волгоградская, 28А-2"];
//В    let arr_near = ["ул. Суворова, 104", "ул. Суворова, 105А", "ул. Суворова, 96Б", "ул. Волгоградская, 38А", "ул. Волгоградская, 28А-2", "ул. Суворова, 63", "ул. Волгоградская, 19"];
    // удаляю рекламу и лишние блоки сверху. нашел в CSS файле у разработчиков комбинацию классов, которые включают только  {display: none} и больше ничего. добавляю эти 2 класса к блокам, которые надо скрыть
    let rek1 = document.querySelector ('.reclame-banner');
    rek1.classList.add("slick-arrow");
    rek1.classList.add("slick-hidden");
    let rek2 = document.querySelector ('.caption .capred');
    rek2.classList.add("slick-arrow");
    rek2.classList.add("slick-hidden");
    let rek3 = document.querySelector ('.page-nav');
    rek3.classList.add("slick-arrow");
    rek3.classList.add("slick-hidden");
    let rek4 = document.querySelector ('.header-border');
    rek4.classList.add("slick-arrow");
    rek4.classList.add("slick-hidden");
    let rek5 = document.querySelector ('.personal-wrap');
    rek5.classList.add("slick-arrow");
    rek5.classList.add("slick-hidden");

// ЗАМЕНЯЮ логотип сайта на 2 чекбокса и кнопку сброса. таблеточки для разделения активных полей и красоты).
// заодно учусь применять экранирующий символ \ для более удобного восприятия и работы с длинной строкой.
//предупреждение сообщает, что использование экранирующего символа (мультистрока) ограничена браузерами поддердивающими стандарт от ES5
    let f = document.querySelector ('.header-logo');
    f.outerHTML = '<img src = "https://www.google.com/s2/favicons?sz=64&domain=tabletka.by" style = "padding:0px 2vw;">\
                   <button style = "border: solid; padding: 7px; font-weight: bold; color: white; border-radius: 10px;" onclick = window.location.reload()>СБРОС</button>\
                   <img src = "https://www.google.com/s2/favicons?sz=64&domain=tabletka.by" style = "padding:0px 2vw;">\
                   <label for = "olana" style = "color: white;"> Выбрать ОДО "Олана плюс"  <input id="olana" class="olana" name = "olana" type="checkbox"></label>\
                   <img src = "https://www.google.com/s2/favicons?sz=64&domain=tabletka.by" style = "padding:0px 2vw;">\
                   <label for = "near" style = "color: white;">Выбрать ближайшие аптеки  <input id="near" class="near"  name = "near" type="checkbox"></label>\
                   <img src = "https://www.google.com/s2/favicons?sz=64&domain=tabletka.by" style = "padding:0px 2vw;">';

// подменяю 100 строк на 300 строк на странице, чтобы перебирать все варианты, а не только на 1й странице. выбрал 100 - т.к. они заданы по умолчанию
    let par = document.querySelector ('#tw3');// нашел ссылку для 100 строк на странице и заменяю значение 100 на 300
    par.value = 300;
    let t = document.querySelectorAll ('span.select-check-text'); // нахожу и подменяю текст в выпадающем списке при выборе количества строк на странице
    t[10].textContent = "Показывать по 300"; // значение 10 узнал при переборе циклом на по console.log

let z = 0; // счетчик, чтобы скрипт не дублировал информацию при повторных кликах. без этого инфа по разбросу цен и номера строки аптеки добавляются к предыдущей каждый клик

// без window.onclick функция запускается при загрузке скрипта и больше не повторяется! сейчас запускается каждый клик, но срабатывает только когда стоит галочка и z = 0, т.е. 1 раз. дальше нужна перезагрузка
    (window.onclick = function sort(){
        if (z == 0){// если функция еще не обрабатывала список аптек (ни один из чекбоксов не был включен) то счетчик пропускает дальше. если уже раз список обрабатывался - функция больше не работает до перезагрузки.
            let ol = document.querySelector ('.olana');//находим наш чекбокс для дальнейшей проверки наличия галочки
            let ne = document.querySelector ('.near'); //находим наш чекбокс для дальнейшей проверки наличия галочки
            if (ol.checked){// проверяем галочку и если да, то начинаем обработку
                let apt = document.querySelectorAll (".tr-border"); // нахожу блоки с информацией аптек
                let c1 = document.querySelectorAll (".content-table .price-value"); // нахожу блок с указанием цен, выбираю первое и последнее значения
                let cn = 0;
                let ck = 0;
                if (c1[0].textContent.indexOf("от")){ // удаляю "от" если он есть и сохраняю очищенные переменные для вывода
                    cn = c1[0].textContent.replace(" от ", " ");}
                else{cn = c1[0].textContent;}
                if (c1[c1.length-1].textContent.indexOf("от")){
                    ck = c1[c1.length-1].textContent.replace("от ", " ");}
                else{ck = c1[c1.length-1].textContent;}
                let i = 1; // счетчик проверенных строк. с 1, т.к. нумерация аптек не с 0 начинается)
                for(let elem of apt){
                    let str = elem.textContent; // выгружвю текстовый контент элемента
                    if (str.includes("Олана Плюс ОДО")){ // проверяю наличие совпадений в контенте
                        let num = elem.querySelector (".tooltip-info-header"); // нахожу внутри найденного элемента блок с адресами
                        let pr = elem.querySelector (".capture"); // нахожу внутри найденного элемента блок с временем обновлений
                        num.textContent = "строка " + i + " из " + apt.length + " " + num.textContent; // добавляю к адресу остающихся аптек номер их строчки из общего количества строк
                        pr.textContent = "разброс цен" + cn + " ... " + ck + " " + pr.textContent; // добавляю перед временем обновления разброс цен
                    }
                    else{
                        elem.classList.add("slick-arrow");
                        elem.classList.add("slick-hidden");
                    }
                    i++; // счетчик проверенных строк - увеличиваю для следующего прохода
                    z++; // записал сюда счетчик для исключения дублирования, т.к. в других местах он срабатывает при загрузке и ничего больше не работает
                }
            }
            else if (ne.checked){ // коментарии смотреть на аналогичных строчках предыдущего условия
                let apt = document.querySelectorAll (".tr-border");
                let c1 = document.querySelectorAll (".content-table .price-value");
                let cn = 0;
                let ck = 0;
                if (c1[0].textContent.indexOf("от")){
                    cn = c1[0].textContent.replace(" от ", " ");
                }
                else {cn = c1[0].textContent;
                     }
                if (c1[c1.length-1].textContent.indexOf("от")){
                    ck = c1[c1.length-1].textContent.replace("от ", " ");
                }
                else {ck = c1[c1.length-1].textContent;
                     }
                let i = 1;
                for(let elem of apt){
                    let str = elem.textContent;
                    if (str.includes(arr_near[0]) || str.includes(arr_near[1]) || str.includes(arr_near[2]) || str.includes(arr_near[3]) || str.includes(arr_near[4]) || str.includes(arr_near[5])){
                        let num = elem.querySelector (".tooltip-info-header");
                        let pr = elem.querySelector (".capture");
                        num.textContent = "строка " + i + " из " + apt.length + " " + num.textContent;
                        pr.textContent = "разброс цен" + cn + " ... " + ck + pr.textContent;
                    }
                    else{
                        elem.classList.add("slick-arrow");
                        elem.classList.add("slick-hidden");
                    }
                    i++;
                    z++;
                }
            }
        }
    })
})();