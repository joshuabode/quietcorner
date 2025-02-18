#----- work in progress -----#

#simulates 2 poisson distributions for people entering and leaving the building
#rate of entering/leaving depends on the time and the current number of people in the building

#----- to work on -----#
#currently the people in the building will converge to 1000 (or half the max capacity), this is unrealistic
#the number is more likely to be close to 0 at the start and end of the day, and close to max capacity mid-day (from 10-4 lets say)
#so we need an alternate way to calculate the multiplier

#should accept arguments into running the file to accept building specific attributes such as opening times, max capacity



import numpy as np
import asyncio
import time
from datetime import datetime, timedelta
import sys
import math

#calculates the time since 8am in seconds
#we assume the building opens at 8am and closes at 6pm
def seconds_since_8am():
    current_time = datetime.now()
    today_8am = datetime(current_time.year, current_time.month, current_time.day, 8, 0, 0)

    return (current_time - today_8am).total_seconds()

    #lambda functions calculate the average rate that people enter or leave depending on 2 factors:
    #-the current time
    #-the number of people in the building currently

    #at the start of the hour people are more likely to enter/leave as they have lectures
    #if the building is close to max capacity then the rate of people leaving will be greater than the rate of people entering (and vice versa)
def lambda_function_enter(time):
    global people_count
    people_count += 1

    crowd_level = people_count/building_capacity

    multiplier = 1 - crowd_level + 0.000001

    lambda_value = multiplier*(0.05 + 2*(np.sin((time + 1800)/(3600/math.pi)))**8)
    print("enter lambda = " + str(lambda_value))
    print("people in building: " + str(people_count))

    return lambda_value

def lambda_function_leave(time):
    global people_count
    people_count -= 1

    crowd_level = people_count/building_capacity

    multiplier = crowd_level + 0.000001

    lambda_value = multiplier*(0.05 + 2*(np.sin((time + 1800)/(3600/math.pi)))**8)
    print("leave lambda = " + str(lambda_value))
    print("people in building: " + str(people_count))


    return lambda_value


#simulates a real time poisson distribution using a lambda value (the average constant rate)
async def poisson(event, lambda_function):
    while True:
        time = seconds_since_8am()
        #only simulates if the time is between 8am and 6pm
        if time > 0 and time < 360000: 
            lambda_val = lambda_function(time)
        else:
            #program halts otherwise
            print("building closed")
            sys.exit()

        #since we are simulating our distribution by randomising the time in between samples,
        #we have to pass in the reciprocal of lambda
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
people_count = 500

asyncio.run(main())
