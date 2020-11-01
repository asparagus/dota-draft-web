'use strict';


$(document).ready(requestHeroes);
$(document).on('page:load', requestHeroes);

function requestHeroes() {
    $.get(
        'https://api.opendota.com/api/heroes',
        {},
        function(heroes) {
            heroes.forEach(hero => {
                var span = document.createElement('span');
                var div = document.createElement('div');
                div.classList.add('sprite');
                div.classList.add('clickable');
                div.classList.add('sprite-miniheroes-' + hero.name.replace('npc_dota_hero_', ''));
                div.setAttribute('title', hero.localized_name);
                div.setAttribute('data-toggle', 'tooltip');
                div.setAttribute('data-placement', 'top');
                div.setAttribute('data-id', hero.id);
                span.appendChild(div);
                document.getElementById(hero.primary_attr + '-heroes').appendChild(span);
            });

            initializeQuery();
            initializeDnD();
            initializeTeams();
        }
    );
}

function requestSuggestions() {
    $.ajax({
        type: 'GET',
        url: 'suggest',
        data: {
            'team': window.picks['ally'].join(), 
            'opponent_team': window.picks['enemy'].join(),
            'bans': window.bans['ally'].concat(window.bans['enemy']).join(),
        },
        success: function(response) {
            console.log(response);
            console.log('Picks:');
            console.log(response.picks.map(x => (x[0], x[1], $('[data-id=' + x[1] + ']').attr('title'))));
            console.log('Bans:');
            console.log(response.bans.map(x => (x[0], x[1], $('[data-id=' + x[1] + ']').attr('title'))));
        },
    });
}

function initializeTeams() {
    window.picks = {'ally': [], 'enemy': []};
    window.bans = {'ally': [], 'enemy': []};
}

function initializeDnD() {
    $('.sprite').draggable({
        revert: function(drop) {
            if(!$(drop).hasClass('droppable') || $(drop).attr('data-id') != $(this).attr('data-id')) {
                $(this).removeClass('disabled');
            }
        },
        zIndex: 100,
        helper: 'clone',
        snap: '.droppable',
        snapMode: 'inner',
        opacity: 0.7,
        start: function(event) {
            $(this).addClass('disabled');
        },
        cancel: '.disabled',
        stop: function(event) {
            $(event.toElement).one('click', function(e) { e.stopImmediatePropagation(); });
        }
    });

    $('.draft').droppable({
        acept: '.sprite',
        hoverClass: 'ui-state-highlight',
        drop: function(event, ui) {
            var name = ui.draggable.attr('title');
            ui.draggable.addClass('disabled');

            $(this).addClass(ui.draggable.attr('class'));
            $(this).attr('data-id', ui.draggable.attr('data-id'));
            $(this).attr('data-sprite', ui.draggable.attr('data-sprite'));
            $(this).removeClass('disabled')
            $(this).droppable('disable');

            console.log(name);
            if ($(this).hasClass('pick')) {
                window.picks[$(this).attr('team')].push(ui.draggable.attr('data-id'));
            } else {
                window.bans[$(this).attr('team')].push(ui.draggable.attr('data-id'));
            }
            
            requestSuggestions();
        }
    });
    $('.draft').click(function() {
        // Remove on click
        if ($(this).hasClass('sprite')) {
            var id = $(this).attr('data-id');
            $('[data-id=' + id + ']').removeClass('disabled');
            var classes = $(this).attr('class').split(' ');
            for(var i = 0; i < classes.length; i ++) {
                if(classes[i].startsWith('sprite')) {
                    $(this).removeClass(classes[i]);
                }
            }
            $(this).removeAttr('data-id');
            $(this).droppable('enable');

            if ($(this).hasClass('pick')) {
                var arr = window.picks[$(this).attr('team')];
                arr.splice(arr.indexOf(id), 1);
            } else {
                var arr = window.bans[$(this).attr('team')];
                arr.splice(arr.indexOf(id), 1);
            }

            requestSuggestions();
        }
    });
}

function initializeQuery() {
    $('#query').on('input', updateSprites);

    $('#query').on('keydown', function(e) {
        if (e.which == 9) {
            $('#query').val($('#query-hint').attr('original-value'));
            $('#query-hint').val($('#query-hint').attr('original-value'));
            updateSprites();
            e.preventDefault();
        }
    });
}

function updateSprites() {
    var query = $('#query').val();
    var lowerQuery = query.toLowerCase();

    var hintSet = false;
    var matches = [];
    $('#heroes .sprite').each(function() {
        var name = $(this).attr('title');
        var lowerName = name.toLowerCase();

        if(lowerName.includes(lowerQuery)) {
            $(this).removeClass('gray');
            matches.push($(this));

            if(!hintSet && query.length > 0 && lowerName.startsWith(lowerQuery)) {
                $('#query-hint').val(query + name.substring(query.length));
                $('#query-hint').attr('original-value', name);
                hintSet = true;
            }
        }
        else {
            $(this).addClass('gray');
        }
    });

    if (matches.length == 1) {
      matches[0].parent().addClass('unique');
    } else {
      clearUnique();
    }

    if (!hintSet) {
        $('#query-hint').val(query);
        $('#query-hint').attr('original-value', query);
    }
}

function clearUnique() {
  $('.unique').removeClass('unique');
}