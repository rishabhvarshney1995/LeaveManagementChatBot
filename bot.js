const { LuisRecognizer } = require('botbuilder-ai');
const {ActivityTypes, ActionTypes, CardFactory} = require('botbuilder');
const {PI} = require('./Dialogs/personalInformation');
const {listUpcomingHolidays} = require('./Dialogs/listUpcomingHolidays');
const {listUpcomingFlexibleHolidayAndAvailSame} = require('./Dialogs/listUpcomingFlexibleHolidayAndAvailSame');
const {viewSubmittedRequests} = require('./Dialogs/viewSubmittedRequests');
const {submitLeaveRequest} = require('./Dialogs/submitLeaveRequest');

const listOfBotNames = ['Alisson Becker','Trent Alexander Arnold','Andrew Robertson','Sadio Mane',
    'Mohamed Salah','Roberto Firmino','Xherdan Shaqiri','Naby Keita'];

const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile';

class MyBot {
    constructor(application, luisPredictionOptions,conversationState, userState) {
        this.luisRecognizer = new LuisRecognizer(
            application,
            luisPredictionOptions,
            true
        );

        this.conversationData = conversationState.createProperty(
            CONVERSATION_DATA_PROPERTY
        );
        this.userProfile = userState.createProperty(USER_PROFILE_PROPERTY);

        this.conversationState = conversationState;
        this.userState = userState;
        this.ifPersonalInfoDialogCompleted = false;
        this.personalDialog = new PI(this.conversationState, this.userState);
    }
    /**
     *
     * @param {TurnContext} turnContext object.
     */
    async onTurn(turnContext) {
        if(turnContext.activity.type === ActivityTypes.Message){
            const userProfile = await this.userProfile.get(turnContext, {});
            const conversationData = await this.conversationState.get(turnContext,{});

            const res = await this.luisRecognizer.recognize(turnContext);
            const topIntent = res.luisResult.topScoringIntent;
            var typeOfHolidayFromLuis;
            var startDateFromLuis;
            var endDateFromLuis;
            console.log(topIntent);
            res.luisResult.entities.forEach((i)=>{
                if(i.type = 'builtin.datetimeV2.daterange'){
                    i.resolution.values.forEach((j)=>{
                        if(j.start){
                            if(j.start.substr(0,4)=='2019'){
                                startDateFromLuis = new Date(j.start+'Z');
                                endDateFromLuis = new Date(j.end+'Z');
                            }
                        }
                    });
                    // console.log(typeof startDateFromLuis);
                }
                if(i.type = 'type of holiday'){
                    typeOfHolidayFromLuis = i.resolution.values[0];
                }
            });

            if(startDateFromLuis){
                console.log(startDateFromLuis.toString());
                console.log(endDateFromLuis.toString());
                console.log(typeOfHolidayFromLuis);
            }
            if(!topIntent){
                var submitLeaveRecord = new submitLeaveRequest();
                var leaveRecordData =[];
                leaveRecordData = await submitLeaveRecord.getLeaveRecordData(
                    new Date(turnContext.activity.value.startDate),
                    new Date(turnContext.activity.value.endDate),
                    turnContext.activity.value.reason
                );
                if(leaveRecordData.length + this.userProfile.numberOfLeavesTaken<27){
                    var listOfHolidaysTaken2 = this.userProfile.listOfHolidaysTaken;
                    leaveRecordData.forEach((i)=>{
                        var flag = 0;
                        listOfHolidaysTaken2.forEach((j)=>{
                            if(j.date == i.date){
                                flag+=1;
                            }
                        });
                        if(flag==0){
                            this.userProfile.listOfHolidaysTaken.push(i);
                        }
                    });
                    this.userProfile.numberOfLeavesTaken = this.userProfile.listOfHolidaysTaken.length;
                    await this.userState.saveChanges(turnContext);
                    await turnContext.sendActivity('Leave Record Added Succesfully');
                }
                else{
                    await turnContext.sendActivity('You cant add this leave Record as this would \nincrease the number of leaves to more than 27.');
                }

            }
            // console.log(res);
            else if(topIntent.intent == 'Greeting' && !this.ifPersonalInfoDialogCompleted && this.userProfile.name=='userProfile'){
                await turnContext.sendActivity('Please Enter your Personal Information.');
                this.ifPersonalInfoDialogCompleted = true;
                await this.personalDialog.personalInformationDialog(turnContext);
            }
            else if (!this.ifPersonalInfoDialogCompleted && this.userProfile.name=='userProfile'){
                await turnContext.sendActivity('Sorry but you cant proceed further without entering personal Information.' +
                    'Please enter your personal Information first.');
                this.ifPersonalInfoDialogCompleted = true;
                await this.personalDialog.personalInformationDialog(turnContext);
            }
            else if(this.userProfile.name=='userProfile'){
                var personalInfo = await this.personalDialog.personalInformationDialog(turnContext);
                if(personalInfo){
                    this.userProfile.name = personalInfo.data.name;
                    this.userProfile.employeeid = personalInfo.data.employeeid;
                    this.userProfile.numberOfFlexibleLeavesTaken = 0;
                    this.userProfile.listOfFlexibleHolidays = [];
                    this.userProfile.numberOfLeavesTaken = 0;
                    this.userProfile.listOfHolidaysTaken = [];
                    userProfile.name = personalInfo.data.name;

                    await this.userState.saveChanges(turnContext);
                    await turnContext.sendActivity(`Thanks ${userProfile.name}`);
                    await turnContext.sendActivity('What do you want to do ?');

                    console.log('Personal Information collected successfully.');
                    console.log('Employee Name : '+this.userProfile.name);
                    console.log('Employee ID : '+this.userProfile.employeeid);
                }
            }
            else if(turnContext.activity.text.substr(0,27) == 'Availing Flexible Leave on '){
                var dateOfFlexibleLeave = turnContext.activity.text.substr(27,42);
                var flag =0;
                this.userProfile.listOfFlexibleHolidays.forEach((i)=>{
                    if(i == dateOfFlexibleLeave){
                        flag+=1;
                        turnContext.sendActivity(`Hi ${this.userProfile.name} (${this.userProfile.employeeid}),\nYou have already availed a flexible leave on ${dateOfFlexibleLeave}.`);
                    }
                });
                if(this.userProfile.numberOfFlexibleLeavesTaken<3 && flag==0){
                    this.userProfile.numberOfFlexibleLeavesTaken+=1;
                    this.userProfile.listOfFlexibleHolidays.push(dateOfFlexibleLeave);
                    await this.userState.saveChanges(turnContext);
                    await turnContext.sendActivity(`Hi ${this.userProfile.name} (${this.userProfile.employeeid}),\nYou have availed 1 flexible leave on ${dateOfFlexibleLeave}.\nYou have ${3-this.userProfile.numberOfFlexibleLeavesTaken} flexible leaves left.`);
                }
                else if(flag==0){
                    await turnContext.sendActivity(`Hi ${this.userProfile.name} (${this.userProfile.employeeid}),\nYou have already availed 3 Flexible Holidays for this year.`);
                }
            }
            //Intent Conditions start here
            else if(this.ifPersonalInfoDialogCompleted && (topIntent.intent == 'Greeting' || topIntent.intent == 'None')){
                await turnContext.sendActivity('I could not understand what you are trying to say, Please try again.');
            }
            else if((topIntent.intent == 'flexibleHolidays'||topIntent.intent == 'Avail flexible holidays') && topIntent.score > 0.5){
                var listUpcomingFlexibleHoliday = new listUpcomingFlexibleHolidayAndAvailSame();
                if(startDateFromLuis && endDateFromLuis){
                    var attach =await listUpcomingFlexibleHoliday.createFlexibleHolidayCard(startDateFromLuis,endDateFromLuis);
                }
                else{
                    var attach =await listUpcomingFlexibleHoliday.createFlexibleHolidayCard(new Date(),new Date('2019-12-31'));
                }
                const card = CardFactory.heroCard(
                    'Flexible Holidays',
                    undefined,
                    attach.buttons,
                    {
                        text:
                            'Click on the leave to avail Flexible Holiday...'
                    }
                );
                const reply = { type: ActivityTypes.Message };
                reply.attachments = [card];

                await turnContext.sendActivity(reply);                }
            else if(topIntent.intent == 'publicHolidays' && topIntent.score > 0.5){
                // console.log(res.luisResult);
                var listUpcomingPublicHoliday = new listUpcomingHolidays();
                if(startDateFromLuis && endDateFromLuis){
                    var attach =await listUpcomingPublicHoliday.createPublicHolidayCard(startDateFromLuis,endDateFromLuis);
                }
                else{
                    var attach =await listUpcomingPublicHoliday.createPublicHolidayCard(new Date(),new Date('2019-12-31'));
                }
                const card = {text : "",
                    attachments : [CardFactory.adaptiveCard(attach)]};
                await turnContext.sendActivity(card);
            }
            else if(topIntent.intent == 'submitLeaveRequest'){
                if(startDateFromLuis && endDateFromLuis){
                    var submitLeaveRecord = new submitLeaveRequest();
                    // var leaveRecordData =[];
                    var leaveRecordData = await submitLeaveRecord.getLeaveRecordData(
                        startDateFromLuis,
                        endDateFromLuis,
                        'No Reason Provided'
                    );
                    if(leaveRecordData.length + this.userProfile.numberOfLeavesTaken<27){
                        var listOfHolidaysTaken2 = this.userProfile.listOfHolidaysTaken;
                        leaveRecordData.forEach((i)=>{
                            var flag = 0;
                            listOfHolidaysTaken2.forEach((j)=>{
                                if(j.date == i.date){
                                    flag+=1;
                                }
                            });
                            if(flag==0){
                                this.userProfile.listOfHolidaysTaken.push(i);
                            }
                        });

                        this.userProfile.numberOfLeavesTaken = this.userProfile.listOfHolidaysTaken.length;
                        await this.userState.saveChanges(turnContext);
                        await turnContext.sendActivity('Leave Record Added Succesfully');
                    }
                    else{
                        await turnContext.sendActivity('You cant add this leave Record as this would \nincrease the number of leaves to more than 27.');
                    }
                }else{
                    var submitLeaveRecord = new submitLeaveRequest();
                    // console.log(res.luisResult.entities);
                    var attach =await submitLeaveRecord.getSubmitLeaveRecord();

                    const card = {text : "You can find the leave records here...",
                        attachments : [CardFactory.adaptiveCard(attach)]};
                    await turnContext.sendActivity(card);
                }
            }
            else if(topIntent.intent == 'viewLeaveRecords' && topIntent.score > 0.5){
                var employeeDetails = new viewSubmittedRequests();
                var attach =await employeeDetails.createEmployeeDetailsCard(this.userProfile);

                const card = {text : "You can find the leave records here...",
                    attachments : [CardFactory.adaptiveCard(attach)]};
                await turnContext.sendActivity(card);
            }
            else{
                await turnContext.sendActivity('I could not understand what you are trying to say, Please try again.');
            }
        }
        else if (
            turnContext.activity.type === ActivityTypes.ConversationUpdate &&
            turnContext.activity.recipient.id !==turnContext.activity.membersAdded[0].id
        ) {
            var randomNumber = Math.floor(Math.random()*listOfBotNames.length);
            await turnContext.sendActivity(
                `Hi and Welcome to Leave Management Chatbot service!\n\nMy name is ${listOfBotNames[randomNumber]}.`
            );
            this.ifPersonalInfoDialogCompleted = false;
            this.userProfile.name = 'userProfile';
        } else if (
            turnContext.activity.type !== ActivityTypes.ConversationUpdate
        ) {
            // Respond to all other Activity types.
            await turnContext.sendActivity(
                `[${ turnContext.activity.type }]-type activity detected.`
            );
        }
    }
}

module.exports.MyBot = MyBot;
