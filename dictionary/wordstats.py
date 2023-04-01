import os

def google_wordstats_json(search):
    json_str = os.popen('npx tsx ../server/wordstats.ts %s' % search).read()

    return json_str
