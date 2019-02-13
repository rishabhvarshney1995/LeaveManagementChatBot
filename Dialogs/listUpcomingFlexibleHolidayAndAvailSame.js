const { holidays } = require('../holidayOperations/holidays');
const flexibleHolidaysCard = require('../Cards/listFlexibleHolidaysCard.json');
const {ActionTypes} = require('botbuilder');

class listUpcomingFlexibleHolidayAndAvailSame{
    constructor(){

    }
    async createFlexibleHolidayCard(startDate,endDate){
        var hol = new holidays();
        var requiredList = [];
        requiredList = hol.getHolidaysByTypeAndStartEndDate('Flexible',startDate,endDate);
        console.log(typeof requiredList);
        flexibleHolidaysCard.buttons=[];
        requiredList.forEach((j)=>{
            var dateOfHoliday = new Date();
            dateOfHoliday.setFullYear(j.year,j.month-1,j.date);
            var dataToPush ={
                type: ActionTypes.ImBack,
                title: dateOfHoliday.toString().substr(0,15)+'   '+j.name,
                value: 'Availing Flexible Leave on '+dateOfHoliday.toString().substr(0,15)
            };
            flexibleHolidaysCard.buttons.push(dataToPush);
        });
        return flexibleHolidaysCard;
    }
}
module.exports.listUpcomingFlexibleHolidayAndAvailSame = listUpcomingFlexibleHolidayAndAvailSame;
