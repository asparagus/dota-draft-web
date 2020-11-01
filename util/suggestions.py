import numpy as np


class Suggestor():
    def __init__(self, stats):
        self.stats = stats
    
    def SuggestPicks(self, num_suggestions=5, team=None, opponent_team=None, bans=None):
        hero_advantages = {}
        for hero in self.stats.hero_picks:
            if ((team and hero in team) or 
                (opponent_team and hero in opponent_team) or
                (bans and hero in bans)):
                continue

            if team:
                teammate_adv = np.mean(
                    [self.stats.Synergy(hero, teammate) for teammate in team])
            if opponent_team:
                opponent_adv = np.mean(
                    [self.stats.Advantage(hero, opponent) for opponent in opponent_team])

            if team and opponent_team:
                hero_advantages[hero] = (teammate_adv + opponent_adv) / 2
            elif team:
                hero_advantages[hero] = teammate_adv
            elif opponent_team:
                hero_advantages[hero] = opponent_adv
            else:
                hero_advantages[hero] = self.stats.WinRate(hero)
        
        adv_heroes = [(adv, hero) for hero, adv in hero_advantages.items()]
        return sorted(adv_heroes)[::-1][:5]

    def SuggestBans(self, num_suggestions=5, team=None, opponent_team=None, bans=None):
        opponent_adv = self.SuggestPicks(num_suggestions, opponent_team, team, bans)
        return [(1 - adv, hero) for adv, hero in opponent_adv]
