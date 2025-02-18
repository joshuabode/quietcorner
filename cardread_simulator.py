#----- work in progress -----#

#simulates 2 poisson distributions for people entering and leaving the building
#rate of entering/leaving depends on the time and the current number of people in the building

#----- to work on -----#

#should accept arguments into running the file to accept building specific attributes such as opening times, max capacity, etc
#if no arguments are provided, use default values



import numpy as np
import asyncio
from datetime import datetime, timedelta
import sys
import math


''' seconds_since_8am():
-calculates the time since 8am in seconds
-we assume the building opens at 8am and closes at 6pm
'''
def seconds_since_8am():
    current_time = datetime.now()
    today_8am = datetime(current_time.year, current_time.month, current_time.day, 8, 0, 0)  #8am in datetime format

    return (current_time - today_8am).total_seconds()   #return the time in seconds since 8am


''' expected_crowd(time):
-simulates the expected capacity of a building during the day
-we will return a value between 0 (empty) and 1 (full capacity)
-this value will help us make the people count converge depending on how busy we expect the building to be

expected crowd of 0.5 means the people_count will converge to half the expected capacity
0 means it will converge to 0
1 means it will converge to full capacity

-the function is a negative quadratic with a peak of 0.95 capacity at 1pm
'''
def expected_crowd(time):
    print("expected capacity: " + str(max(0.02, (-(0.9/324000000)*(time-18000)**2) + 0.95)))

    #quadratic is in the form y = A(x-B)^2 + C
    A = -(0.93/324000000)   #picked to pass through the point (0, 0.02)
    B = 18000               #how much we shift the graph to the right (so peak is at 1pm instead of 8am) 
    C = 0.95                #the maximum expected capacity the qraph will take
    y = A*(time-B)**2 + C
    return max(0.02, y)     #return a minimum of 0.02



''' lambda_function_enter(time) and lambda_function_leave(time)

    lambda functions calculate the average rate that people enter or leave depending on 2 factors:
    -the current time
    -how close the crowd level is to the expected crowd level

    the function used to model the activity is a sin squared graph with quadratic amplitude decay (yeah its abit complicated lol)

    some things to note about this model:
    -if the crowd level is similar to the expected crowd level, the count of people in the building should be roughly constant (as the lambda values for each poisson
    stream will be similar)
    -if the crowd level is higher than the expected crowd level, the lambda_value for leaving will be greater than the lambda_value for entering, and vice versa
    -as a result, the people count should always converge depending on the expected crowd level at a point in time


    explaining the sin graph:
    -a sin squared graph is used with a period of 3600 to model higher card reader activity at the start of the hour, as lectures begin/end, and lower
    activity in between
    -the sin graph decays quadratically to model how there will generally be less card reader activity at the start and end of the day

'''
def lambda_function_enter(time):
    global people_count
    people_count += 1

    crowd_level = people_count/building_capacity

    multiplier = (expected_crowd(time)/crowd_level)     #multiplier controls how the people_count will converge

    #grpah is in the form y = (-A(x-B)^2 + C)(sin((x+D)/E))^2 + F
    A = 1/800000000     #controls how fast the sin graph decays
    B = 18000           #shifts the whole graph by 5 hours
    C = 0.95            #initial peak amplitude
    D = 1800            #shift the sin graph by half an hour
    E = 3600/math.pi    #controls the period of the sin graph (period is 1 hour)
    F = 0.05            #shift the whole graph up by 0.05

    #note: as x becomes very large, y will become negative, but thats fine as long as it doesnt become negative during opening times

    y = (-A*(time-B)**2 + C)*(np.sin((time+D)/E))**2 + F

    lambda_value = multiplier*y


    print("enter lambda = " + str(lambda_value))
    print("people in building: " + str(people_count))

    return lambda_value

def lambda_function_leave(time):
    global people_count
    people_count -= 1

    crowd_level = people_count/building_capacity

    multiplier = (crowd_level/expected_crowd(time))

    

    #grpah is in the form y = (-A(x-B)^2 + C)(sin((x+D)/E))^2 + F
    A = 1/800000000
    B = 18000
    C = 0.95
    D = 1800
    E = 3600/math.pi
    F = 0.05

    y = (-A*(time-B)**2 + C)*(np.sin((time+D)/E))**2 + F

    lambda_value = multiplier*y

    print("leave lambda = " + str(lambda_value))
    print("people in building: " + str(people_count))


    return lambda_value

''' poisson(event, lambda_function)
-asynchronous function
-simulates a real time poisson distribution using a lambda value (the average constant rate)
'''
async def poisson(event, lambda_function):
    while True:        
        time = seconds_since_8am()
        #only simulates if the time is between 8am and 6pm
        if time > 0 and time < 36000: 
            lambda_val = lambda_function(time)
        else:
            #program halts otherwise
            print("building closed")
            sys.exit()

        #since we are simulating our distribution by randomising the time in between samples,
        #we have to pass in the reciprocal of lambda

        #max function allows us to avoid passing in negative lambda values
        wait_time = np.random.exponential(scale=1/max(0.000001, lambda_val))
        await asyncio.sleep(wait_time)
        print("event " + event + " happened at " + str(datetime.now()))

#note: async allows functions to run asynchronously
async def main():

    #set up the 2 poisson streams
    await asyncio.gather(
        poisson("enter building", lambda_function_enter),
        poisson("leave building", lambda_function_leave)
    )

building_capacity = 2000
people_count = 50

asyncio.run(main())
