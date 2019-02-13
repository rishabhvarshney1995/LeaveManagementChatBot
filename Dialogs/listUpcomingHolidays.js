const { holidays } = require('../holidayOperations/holidays');
const publicHolidaysCard = require('../Cards/listPublicHolidayCard.json');

class listUpcomingHolidays {
    constructor(){

    }
    async createPublicHolidayCard(startDate,endDate){
        var hol = new holidays();
        var requiredList = hol.getHolidaysByTypeAndStartEndDate('Fixed',startDate,endDate);
        publicHolidaysCard.body.forEach((i)=>{
            if(i.type == 'FactSet'){
                i.facts =[];
                requiredList.forEach((j)=>{
                    var dateOfHoliday = new Date();
                    dateOfHoliday.setFullYear(j.year,j.month-1,j.date);
                    var dataToPush = {"title":dateOfHoliday.toString().substr(0,15),"value":j.name};
                    i.facts.push(dataToPush);
                });
            }
        });
        return publicHolidaysCard;
    }
}
module.exports.listUpcomingHolidays = listUpcomingHolidays;
