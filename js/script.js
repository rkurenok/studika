'use strict'

// webp конвертер

document.addEventListener('DOMContentLoaded', function() {
  testWebP(document.body)
})

function testWebP(elem) {
  const webP = new Image();
  webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  webP.onload = webP.onerror = function () {
    webP.height === 2 ? elem.classList.add('webp') : elem.classList.add('webp-false')
  }
}

//--------------------------------------------------------------------------------------------------------------------------------------
// код для кнопок удаления текста из полей поиска

let buttons = document.querySelectorAll(".button-reset"); // кнопки
let inputs = document.querySelectorAll(".search-input"); // поля

buttons.forEach(element => { // для каждой кнопки
    element.addEventListener('click', (e) => {  // вешаем обработчик событий клика
        e.preventDefault(); // предотвращаем действие браузера по умолчанию (submit в form = перезагрузка страницы)
        element.previousElementSibling.value = ""; // удаляем содержимое поля поиска
        element.classList.remove('active'); // скрываем кнопку
        findCities(""); // изменяем результат поиска (передаем пустую строку)
    })
})

inputs.forEach(element => { // для каждого поля ввода
    let button = element.nextElementSibling; // кнопка текущего поля
    element.addEventListener('input', () => { // обработчик события на изменение содержимого
        if (element.value) { // если что-то ввели
            button.classList.add('active'); // показываем кнопку
        }
        else { // если все стерли
            button.classList.remove('active'); // скрываем кнопку
        }
    })
})

//----------------------------------------------------------------------------------------------------------------------
// код для анимации меню-бургер

let menuBurger = document.querySelector(".icon-menu");

menuBurger.addEventListener('click', function() { // при клике на меню - добавляем/удаляем классы необходимым элементам
    menuBurger.classList.toggle('active');
    document.querySelector(".header__body").classList.toggle('active');
    document.querySelector(".header__profile").classList.toggle('active');
    document.querySelector(".header__bottom").classList.toggle('active');
    document.querySelector(".header__city").classList.toggle('active');
    document.querySelector(".header__search").classList.toggle('active');
})
// код для функционала с городами

let cityBlock = document.querySelector(".header__city-block");
let arrayCities;
let searchCitiesInput = document.querySelector(".search-input");
let cityList = document.querySelector(".city-list");
let headerCityText = document.querySelector(".header__city > span");
let preloader = document.querySelector('.header__city-block__preloader');

let cityCoockie = getCookie('city'); // получаем куки сохраненных городов
if (cityCoockie) { // если они есть
    cityCoockie = JSON.parse(cityCoockie);
    setHeaderCity(cityCoockie); // устанавливаем названия в шапку
}

document.addEventListener('click', async function (e) {
    if (e.target.closest('div.header__city') && !cityBlock.classList.contains('active')) { // если клик по городу
        cityBlock.classList.add('active'); // показываем блок с городами

        if (arrayCities == null) { // если еще не получали список городов
            arrayCities = await getСities(); // получаем список городов
            insertCities(arrayCities); // показываем список городов
            preloader.classList.add('hidden'); // скрываем прелоадер

            if (cityCoockie) { // если есть куки
                for (let i = 0; i < cityCoockie.length; i++) {
                    addSelectedCity(cityCoockie[i].name, cityCoockie[i].id); // показываем выбранные города

                    let cities = document.querySelectorAll(".city-item");
                    for (let j = 0; j < cities.length; j++) { // использован стандартный for для оптимизации (возможность прервать цикл)
                        if (cities[j].dataset.id == cityCoockie[i].id) {
                            // меняем стили выбранных городов в списке
                            cities[j].classList.add('active');
                            cities[j].style = 'background: #f1f1f1;';
                            break;
                        }
                    }
                }
            }
        }
    }
    else if (cityBlock.classList.contains('active') && !e.target.closest('div.header__city-block')) { // если открыт блок с городами и клик не по нему
        cityBlock.classList.remove('active'); // скрываем блок
    }
})

searchCitiesInput.addEventListener('input', () => { // при изменении содержимого инпутов-поисковиков
    findCities(searchCitiesInput.value); // вызываем функцию поиска городов
})

cityList.addEventListener('click', (e) => { // клик по городу
    let target = e.target.closest('div');
    let targetId = target.dataset.id;

    if (target.classList.contains('active')) { // если город уже был выбран
        removeSelectedCity(targetId); // удаляем его из выбранных
        target.classList.remove('active'); // убираем стили
        target.style = '';
    }
    else { // иначе
        let name = target.firstChild.innerText;
        addSelectedCity(name, targetId); // добавляем город к выбранным
        target.classList.add('active'); // добавляем стили
        target.style = 'background: #f1f1f1;';
    }
})

document.querySelector(".city-save").addEventListener('click', (e) => { // кнопка сохранить
    let arraySelectedCity = [];

    if (document.querySelector('.city-select')) { // если есть выбранные города
        document.querySelectorAll('.city-select').forEach(city => {
            arraySelectedCity.push({ 'name': city.innerText, 'id': city.dataset.id }) // добавляем их в массив
        });
        setCookie('city', JSON.stringify(arraySelectedCity), { secure: false, 'max-age': 3600 }); // устанавливаем куки
        sendSaveData(JSON.stringify(arraySelectedCity)); // отправка данных на сервер с загрушкой
    }
    else { // иначе добавляем дефолтное значение в массив и удаляем существующие куки
        arraySelectedCity[0] = { "name": "Любой регион", "id": "null" };
        deleteCookie('city');
    }

    setHeaderCity(arraySelectedCity); // обновляем города в хэдере

    e.stopPropagation(); // предотвращаем всплытие события, чтобы блок мог закрыться
    cityBlock.classList.remove('active'); // закрываем блок с городами
})

function setHeaderCity(arr) { // устанавливаем список городов в header
    headerCityText.innerText = "";

    for (let i = 0; i < arr.length; i++) {
        headerCityText.innerHTML += arr[i].name; // добавляем город
        if (arr[i + 1]) { // если не последний в списке
            headerCityText.innerHTML += ", "; // делаем отступ для следующего
        }
    }
}


async function getСities() { // получаем список городов
    let response = await fetch('https://studika.ru/api/areas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
    });

    // получаем и расшифровываем ответ
    let result = await response.text();
    return JSON.parse(result);
}

function insertCities(array, areaName) { // заполняем блок городов полученным массивом
    let div, span;

    Array.from(array).forEach(element => { // проходим по каждому элементы массива
        div = document.createElement('div');
        span = document.createElement('span');

        for (let key in element) { // перебираем ключи
            if (key == 'name') {
                span.innerHTML = element[key]; // записываем имя города
                span.classList.add('city-name');
                continue;
            }
            if (key == 'cities') {
                continue;
            }
            div.setAttribute('data-' + key, element[key]); // Добавляем data-атрибуты
            div.classList.add('city-item');
        }

        div.append(span); // добавляем span в div
        if (areaName != undefined) { // если было передано имя области - добавляем еще один span с другим классом
            span = document.createElement('span');
            span.innerHTML = areaName;
            span.classList.add('area-name');
            div.append(span);
        }
        cityList.append(div); // добавляем div в общий блок городов

        if (div.dataset.type == 'area') { // если это область
            insertCities(element['cities'], span.innerHTML); // вызываем повторно функцию и передаем имя области
        }
    });
}

function addSelectedCity(name, id) { // добавляет выбранный город
    // создаем блок, стили и атрибуты
    let div = document.createElement('div');
    div.classList.add("city-select");
    div.setAttribute('data-id', id);
    // создаем кнопку-крестик
    let button = document.createElement('button');
    button.classList.add("header__city-select__button", "button");
    div.innerText = name;
    div.append(button);
    document.querySelector(".city-selected").append(div);

    // перезаписываем обработчик клика крестика выбранных городов
    document.querySelectorAll('.header__city-select__button').forEach(button => {
        button.addEventListener('click', (e) => { // если был клик по крестику
            e.stopPropagation(); // прекращаем всплытие события
            let cityId = e.target.closest('div').dataset.id;
            removeSelectedCity(cityId); // удаляем город по id
            document.querySelectorAll('.city-item').forEach(el => { // убираем стиль у удаленного города из списка городов
                if (el.dataset.id == cityId) {
                    el.classList.remove('active');
                    el.style = '';
                }
            })
        })
    })
}

function findCities(value) { // поиск городов
    let arrayCityName = document.querySelectorAll(".city-name");
    value = value.toLowerCase(); // избавляемся от регистра

    for (let i = 0; i < arrayCityName.length; i++) {
        if (!arrayCityName[i].innerText.toLowerCase().match(value)) { // если совпадений нет
            arrayCityName[i].parentElement.style.display = 'none'; // скрываем блок
            continue;
        }
        else if (arrayCityName[i].parentElement.style.display = 'none') { // если есть совпадение, но блок скрыт
            arrayCityName[i].parentElement.style.display = 'block'; // показываем блок
        }

        if (value) {
            let cityText = arrayCityName[i].innerText;
            let matchAll = cityText.toLowerCase().matchAll(value); // ищем все совпадения
            let pos = 0;
            arrayCityName[i].innerHTML = ""; 
            // оборачиваем найденные совпадения в span
            for (let match of matchAll) {
                arrayCityName[i].innerHTML += cityText.slice(pos, match.index) + '<span>' + cityText.slice(match.index, match.index + value.length) + '</span>';
                pos = match.index + value.length;
            }
            arrayCityName[i].innerHTML += cityText.slice(pos);

        }
        else if (arrayCityName[i].children.length) { // произойдет при нажатии на крестик (само условие для оптимизации)
            arrayCityName[i].innerHTML = arrayCityName[i].innerText; // убираем лишние spanы и подсветку
        }
    }
}

function removeSelectedCity(id) { // удаляет город по id из списка выбранных
    document.querySelectorAll(".city-select").forEach(el => {
        if (el.dataset.id == id) {
            el.classList.add('not-active'); // добавляем класс с анимацией
            setTimeout(() => {el.remove()}, 500); // даем проиграть анимации и удаляем
        }
    })
}

function sendSaveData(data) { // отправляем сохраненные данные на сервер-заглушку
    let xhr = new XMLHttpRequest();

    xhr.open("POST", "#", false); // заглушка (404 Not Found)
    xhr.send(data);

    xhr.onload = () => console.log(xhr.response); // читаем ответ сервера
}

//--------------------------------------------------------------------------------------------------------------------------------
// функции для работы с куками

// установка печенек
function setCookie(name, value, options = {}) {
    options = {
        path: '/',
        // при необходимости добавьте другие значения по умолчанию
        ...options
    };

    if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
        updatedCookie += "; " + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }

    document.cookie = updatedCookie;
}

// возвращает куки с указанным name,
// или undefined, если ничего не найдено
function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

// удаляет куки
function deleteCookie(name) {
    setCookie(name, "", {
        'max-age': -1
    })
}

//-----------------------------------------------------------------------------------------------
// код для скролла основной части шапки

let ul = document.querySelector('.header__nav-list');

headerScroll(200); // в качестве параметра - расстояние скролла (px) за клик

function headerScroll(distance) {
    let rightArrow = document.querySelector('.header__bottom__scroll__right');
    let leftArrow = document.querySelector('.header__bottom__scroll__left');
    let header = document.querySelector(".header__body");

    rightArrow.addEventListener('click', function () { // при клике на правую стрелку
        header.scrollBy({
            top: 0,
            left: distance,
            behavior: 'smooth'
        });

        leftArrow.style.display = 'block'; // показываем левую стрелку
        // ul.classList.add('grad-left'); // добавляем градиент

        if (header.scrollWidth - header.scrollLeft - header.offsetWidth <= distance + 28) { // если осталось меньше одного шага (+ размер самой стрелки) до правого края
            rightArrow.style.display = ''; // скрываем стрелку
            // header.classList.remove('grad-right'); // убираем градиент
        }
    })

    leftArrow.addEventListener('click', function () { // при клике на левую стрелку
        header.scrollBy({
            top: 0,
            left: -distance,
            behavior: 'smooth'
        });

        rightArrow.style.display = 'block'; // показываем правую
        // header.classList.add('grad-right'); // добавляем градиент

        if (header.scrollLeft <= distance + 28) { // если меньше одного шага (+ размер самой стрелки) до левого края
            leftArrow.style.display = '';
            // ul.classList.remove('grad-left'); // убираем градиент
        }
    })

    let contentWidth = document.querySelector('div.container').offsetWidth; // ширина контента
    if (ul.scrollWidth > contentWidth && contentWidth > 767.98) { // если ширина списка меню больше контейнера
        rightArrow.style.display = 'block'; // показываем правую стрелку
        // header.classList.add('grad-right'); // добавляем градиент
    }
}

// небольшой обработчик стилизации меню при клике
(function() {
    ul.addEventListener('click', (e) => { // перехватываем нажатие на пункт меню
        ul.querySelectorAll("li > a").forEach(link => {
            if (link.classList.contains('active')) { // убираем стиль у активной ссылки
                link.classList.remove('active');
            }
        })
        let target = e.target;
        target.classList.add('active'); // добавляем стиль нажатой ссылке
    })
})()

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------