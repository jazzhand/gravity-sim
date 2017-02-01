G = 6.674e-11
earth_mass = 5.972e24
moon_mass = 7.348e22
r = 384400000
moon_vel = 1022

def force():
	return (G * earth_mass * moon_mass)/(r**2)

print "Force between earth and moon: ", force(), "N"
