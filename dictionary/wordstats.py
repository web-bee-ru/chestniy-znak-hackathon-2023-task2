import os


def google_wordstats_json(search):
    json_str = os.popen('npx tsx ../server/bin/google.ts %s' % search).read()

    return json_str

def google_wordstats_json_daily(search):
    json_str = os.popen('npx tsx ../server/bin/google-daily.ts %s' % search).read()

    return json_str
