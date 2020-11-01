import datetime

from util import stats
from util import suggestions

from flask import Flask, render_template, request
app = Flask(__name__, static_url_path='')


@app.route('/suggest', methods=['GET'])
def suggest():
    team = [int(i) for i in request.args.get('team', '').split(',') if i]
    opponent_team = [int(i) for i in request.args.get('opponent_team', '').split(',') if i]
    bans = [int(i) for i in request.args.get('bans', '').split(',') if i]
    # team = request.form['team'].split(',')
    # opponent_team = request.form['opponent_team'].split(',')
    # bans = request.form['bans'].split(',')

    stats_accumulator = stats.Stats.LoadFromJson('./data/stats')
    suggestor = suggestions.Suggestor(stats_accumulator)
    pick_advs = suggestor.SuggestPicks(5, team, opponent_team, bans)
    ban_advs = suggestor.SuggestBans(5, team, opponent_team, bans)
    return {
        'picks': pick_advs,
        'bans': ban_advs,
    }


@app.route('/')
def root():
    # For the sake of example, use static information to inflate the template.
    # This will be replaced with real information in later steps.
    return render_template('index.html')


if __name__ == '__main__':
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    # Flask's development server will automatically serve static files in
    # the "static" directory. See:
    # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
    # App Engine itself will serve those files as configured in app.yaml.
    app.run(host='127.0.0.1', port=8080, debug=True)