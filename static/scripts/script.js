'use strict';


$(document).ready(requestHeroes);
$(document).on('page:load', requestHeroes);

function requestHeroes() {
    $.get(
        'https://api.opendota.com/api/heroes',
        {},
        function(heroes) {
            heroes.sort((a, b) => a.localized_name.localeCompare(b.localized_name));
            heroes.forEach(hero => {
                var div = document.createElement('div');
                div.classList.add('sprite');
                div.classList.add('clickable');
                div.classList.add('sprite-miniheroes-' + hero.name.replace('npc_dota_hero_', ''));
                div.setAttribute('title', hero.localized_name);
                div.setAttribute('data-toggle', 'tooltip');
                div.setAttribute('data-placement', 'top');
                div.setAttribute('data-id', hero.id);
                document.getElementById('heroes').appendChild(div);
            });

            initializeQuery();
            initializeDraft();
            initializeTeams();
        }
    );
}

function requestSuggestions() {
    $.ajax({
        type: 'GET',
        url: 'suggest',
        data: {
            'team': window.picks['radiant'].join(),
            'opponent_team': window.picks['dire'].join(),
            'bans': window.bans.join(),
        },
        success: function(response) {
            clearSuggestions();
            response.picks.forEach(function(element) {
                let hero_id = element[1];
                let win_rate = element[0];
                addSuggestion(hero_id, win_rate, 'radiant');
            });
            response.bans.forEach(function(element) {
                let hero_id = element[1];
                let win_rate = element[0];
                addSuggestion(hero_id, 1 - win_rate, 'dire');
            });
        },
    });
}

function initializeTeams() {
    window.picks = {'radiant': [], 'dire': []};
    window.bans = [];
}

function addSuggestion(hero_id, win_rate, team) {
    let hero_name = $('[data-id=' + hero_id + ']').attr('title');
    let div = document.createElement('div');
    let p = document.createElement('p');
    p.innerText = hero_name + " - " + (win_rate * 100).toFixed(2) + "%";
    div.classList.add('suggestion');
    div.append(p);
    document.getElementById(team + '-suggestions').appendChild(div);
}

function clearSuggestions() {
    $('#suggestions .suggestion').remove();
}

function pick(hero_id, team) {
    if (window.picks[team].includes(hero_id) || window.picks[team].length >= 5) { // Then unpick it
        let idx = window.picks[team].findIndex(i => i == hero_id);
        let draft_slot_obj = $($('.draft[data-team=' + team + ']')[idx]);
        console.log(draft_slot_obj.classList);
        draft_slot_obj.removeClass(draft_slot_obj.attr('class'));
        draft_slot_obj.removeAttr('title');
        draft_slot_obj.removeAttr('data-id');
        draft_slot_obj.addClass('draft');
        window.picks[team].splice(idx, 1);
        $('#heroes .sprite[data-id=' + hero_id + ']').removeClass('disabled');
    } else {
        window.picks[team].push(hero_id);
        let hero_obj = $('#heroes .sprite[data-id=' + hero_id + ']');
        let classes = hero_obj.attr('class');
        hero_obj.addClass('disabled');

        let hero_idx = window.picks[team].length - 1;
        let draft_slot_obj = $($('.draft[data-team=' + team + ']')[hero_idx]);
        draft_slot_obj.addClass(classes);
        draft_slot_obj.attr('title', hero_obj.attr('title'));
        draft_slot_obj.attr('data-id', hero_id);
    }
    clearSelection();
    requestSuggestions();
}

function ban(hero_id) {
    if (window.bans.includes(hero_id)) { // Already banned, unban it
        let idx = window.bans.findIndex(i => i == hero_id);
        window.bans.splice(idx, 1);
        $('#heroes .sprite[data-id=' + hero_id + ']').removeClass('banned');
    } else {
        window.bans.push(hero_id);
        $('#heroes .sprite[data-id=' + hero_id + ']').addClass('banned');
    }
    clearSelection();
    requestSuggestions();
}

function initializeDraft() {
    $('#heroes .sprite').click(function() {
        $('#query').val($(this).attr('title'));
        updateSelection();
    });
    $('#draft .draft').click(function() {
        if ($(this).attr('data-id') != undefined) {
            $('#query').val($(this).attr('title'));
            updateSelection();
        }
    });
    $('#radiant-pick').click(function() {
        if ($(this).attr('disabled') == 'disabled' ) {
            return false;
        }
        pick(window.current, 'radiant');
    });
    $('#dire-pick').click(function() {
        if ($(this).attr('disabled') == 'disabled' ) {
            return false;
        }
        pick(window.current, 'dire');
    });
    $('#ban').click(function() {
        if ($(this).attr('disabled') == 'disabled' ) {
            return false;
        }
        ban(window.current);
    });
}

function initializeQuery() {
    $('#query').on('input', updateSelection);

    $('#query').on('keydown', function(e) {
        if (e.which == 9) {
            $('#query').val($('#query-hint').attr('original-value'));
            $('#query-hint').val($('#query-hint').attr('original-value'));
            updateSelection();
            e.preventDefault();
        }
    });

    updateSelection();
}

function clearSelection() {
    $('#query').val('');
    updateSelection();
}

function updateSelection() {
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

    $('.unique').removeClass('unique');
    $('#radiant-pick').removeClass('active');
    $('#dire-pick').removeClass('active');
    $('#ban').removeClass('active');
    if (matches.length == 1) {
        window.current = matches[0].attr('data-id');
        $('#selector button').removeAttr('disabled');
        $('.sprite[data-id=' + window.current + ']').addClass('unique');
        if (window.picks['radiant'].includes(window.current)) {
            $('#radiant-pick').addClass('active');
            $('#dire-pick').attr('disabled', 'disabled');
            $('#ban').attr('disabled', 'disabled');
        }
        if (window.picks['dire'].includes(window.current)) {
            $('#dire-pick').addClass('active');
            $('#radiant-pick').attr('disabled', 'disabled');
            $('#ban').attr('disabled', 'disabled');
        }
        if (window.bans.includes(window.current)) {
            $('#ban').addClass('active');
            $('#radiant-pick').attr('disabled', 'disabled');
            $('#dire-pick').attr('disabled', 'disabled');
        }
    } else {
        window.current = undefined;
        $('#selector button').attr('disabled', 'disabled');
    }

    if (!hintSet) {
        $('#query-hint').val(query);
        $('#query-hint').attr('original-value', query);
    }
}
