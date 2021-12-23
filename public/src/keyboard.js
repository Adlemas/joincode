'use strict';

var TEXT = "The word \"technology\" and its uses have immensely changed since the 20th century, and with time, it has continued to evolve ever since. We are living in a world driven by technology. The advancement of technology has played an important role in the development of human civilization, along with cultural changes. Technology provides innovative ways of doing work through various smart and innovative means. Electronic appliances, gadgets, faster modes of communication, and transport have added to the comfort factor in our lives. It has helped in improving the productivity of individuals and different business enterprises. Technology has brought a revolution in many operational fields. It has undoubtedly made a very important contribution to the progress that mankind has made over the years.";
var completed = 0;

const root = document.createElement('label');
root.className = 'root';

const colored = document.createElement('label')
colored.className = 'active'

const future = document.createElement('label');
future.innerText = TEXT;

const timer_container = document.createElement('div')
timer_container.className = "timer-container"
const timer = document.createElement('label')
timer.innerText = "00:00";
timer.className = 'timer'
const timer_text = document.createElement('label')
timer_text.innerText = "time";
timer_text.className = 'timer-text'
var second = 1;

timer_container.appendChild(timer)
timer_container.appendChild(timer_text)

const tip = document.createElement('small')
tip.innerText = "Press any key to start..."

var interval = null;

window.onload = function() {

    /**
     * Keyboard
     */
    function getKey (e) {
        var location = e.location;
        var selector;
        if (location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
            selector = ['[data-key="' + e.keyCode + '-R"]']
        } else {
            var code = e.keyCode || e.which;
            selector = [
                '[data-key="' + code + '"]',
                '[data-char*="' + encodeURIComponent(String.fromCharCode(code)) + '"]'
            ].join(',');
        }
        return document.querySelector(selector);
    }

    document.body.addEventListener('keydown', function (e) {
        e.preventDefault()
        var key = getKey(e);
        if (!key) {
            return console.warn('No key for', e.keyCode);
        }

        key.setAttribute('data-pressed', 'on');
    });

    document.body.addEventListener('keyup', function (e) {
        e.preventDefault()
        var key = getKey(e);
        key && key.removeAttribute('data-pressed');
    });

    function size () {
        var size = keyboard.parentNode.clientWidth / 90;
        keyboard.style.fontSize = size + 'px';
    }

    var keyboard = document.querySelector('.keyboard');
    window.addEventListener('resize', function (e) {
        size();
    });
    size();
    /**
     * Keyboard end
     */

    root.appendChild(colored)
    root.appendChild(future)
    document.querySelector('#content').appendChild(root);
    document.querySelector('#content').appendChild(timer_container);
    document.querySelector('#content').appendChild(tip);

    window.onkeydown = function(e) {
        e.preventDefault()
        if(e.key == 'Escape' && e.shiftKey){
            stop_()
        }
        if(interval == null && second === 1)
        {
            tip.innerText = "Press Shift+Esc for stop..."
            interval = setInterval(() => {
                let minutes = Math.floor(second / 60)
                let seconds = second % 60
                timer.innerText = `${String(minutes).length < 2 ? '0' + String(minutes) : minutes}:${String(seconds).length < 2 ? '0' + String(seconds) : seconds}`
                second++
            }, 1000)
        }
        if(e.key == (TEXT[completed]))
        {
            completed++;
            update_text();
        }
    }
}

const update_text = () =>
{
    colored.innerHTML = TEXT.slice(0, completed) + (TEXT[completed] ? `<label style="background-color: #fff; color: #222;">${TEXT[completed]}</label>` : '');
    future.innerText = TEXT.slice(completed + 1) ? TEXT.slice(completed + 1) : '';
    if(!TEXT.slice(completed + 1))
    {
        stop_()
    }
}

const stop_ = () => {
    tip.innerText = "Press any key to start..."
    clearInterval(interval);
    interval = null;
    completed = 0;
    update_text()
    let count = 0;
    let inter = setInterval(() => {
        if(count >= 2) {
            clearInterval(inter)
            return;
        }
        timer.style.fontSize = '26px';
        setTimeout(() => {
            timer.style.fontSize = '23px';
        }, 500)
        count++;
    }, 1000)
    setTimeout(() => {
        timer.innerText = "00:00"
        second = 1;
    }, 3000)
}