import re, json, sqlite3

conn = sqlite3.connect('coordinates.sqlite')
c = conn.cursor()

c.execute ('CREATE TABLE IF NOT EXISTS "states" ("id" INTEGER PRIMARY KEY, "abbr" VARCHAR(16), "name" VARCHAR(16), "code" VARCHAR(16), point VARCHAR(1), x FLOAT, y FLOAT)')

def commit_coords():
    f = open('states_float.csv', 'r').read()
    f = f.split('\n')
    for k in range(1, len(f)):
        p = f[k].split('\t')
        coords = p[2]
        xys = re.findall('([ML]) ([-0-9\.]+),([-0-9\.]+)', coords)
        print p[2], len(xys)
        for xy in xys:
            #print xy
            c.execute("INSERT into states (abbr, name, point, x, y) VALUES (?, ?, ?, ?, ?)", (p[0], p[1], xy[0], float(xy[1]), float(xy[2])))
        conn.commit()
    f.close()
#commit_coords(f)

def make_paths():
    f = open('states_float.csv', 'r').read()
    f = f.split('\n')
    g = open('coords_short.csv', 'w')

    for k in range(1, len(f)):
        p = f[k].split('\t')
        abbr = p[0]
        path = ""
        x0 = None
        y0 = None
        
        m = c.execute("SELECT * FROM states where abbr = '" + abbr + "'")
        for mm in m.fetchall():
            x = int(10*mm[5])/10        
            y = int(10*mm[6])/10
            #if x != x0 or y != y0:
            path = path + "%s%s,%s" % (mm[4], str(x),str(y))
            x0 = x
            y0 = y
        print mm[1]+"\t"+mm[2]+"\t"+path
        g.write(mm[1]+"\t"+mm[2]+"\t"+path+"\n")
    g.close()

make_paths()
conn.close()

