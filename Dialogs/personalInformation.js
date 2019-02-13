const { ActivityTypes } = require('botbuilder');
const {
    DialogSet,
    WaterfallDialog,
    TextPrompt,
    NumberPrompt,
    DialogTurnStatus
} = require('botbuilder-dialogs');

const DIALOG_STATE = 'dialogState';
const USER_STATE = 'userState';
const NAME_PROMPT = 'namePropmpt';
const EMPLOYEE_ID_PROMPT = 'agePrompt';
const MAIN_PI_DAILOG = 'mainDailog';

class personalInformation {
    constructor(conversationstate, userState) {
        this.conversationstate = conversationstate;
        this.userState = userState;
        this.dialogStateProp = this.conversationstate.createProperty(
            DIALOG_STATE
        );
        this.userStateProp = this.userState.createProperty(USER_STATE);

        this.dailogs = new DialogSet(this.userStateProp);
        this.dailogs.add(new TextPrompt(NAME_PROMPT));
        this.dailogs.add(new NumberPrompt(EMPLOYEE_ID_PROMPT));
        this.dailogs.add(
            new WaterfallDialog(MAIN_PI_DAILOG)
                .addStep(this.nameStep.bind(this))
                .addStep(this.employeeIdStep.bind(this))
                .addStep(this.endPIStep.bind(this)));
    }

    async personalInformationDialog(turnContext) {
        if (turnContext.activity.type === ActivityTypes.Message) {
            const dialogContext = await this.dailogs.createContext(turnContext);
            const results = await dialogContext.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.cancelled:
                case DialogTurnStatus.empty:
                    await dialogContext.beginDialog(MAIN_PI_DAILOG);
                    break;

                case DialogTurnStatus.waiting:
                    break;

                case DialogTurnStatus.complete:
                    const userInfo = results.result;
                    if(this.validateName(userInfo.data.name)){
                        return userInfo;
                        break;
                    }
                    else{
                        await dialogContext.beginDialog(MAIN_PI_DAILOG);
                        break;
                    }
            }

            await this.userState.saveChanges(turnContext);
        }
    }

    async nameStep(stepContext) {
        return await stepContext.prompt(NAME_PROMPT, {
            prompt:'Please Enter your Name.',
            retryPrompt:'Please enter a Valid Name.'
        });
    }

    async employeeIdStep(stepContext) {
        // if(this.validateName(stepContext.result)){
            stepContext.values.name = stepContext.result;
            return await  stepContext.prompt(EMPLOYEE_ID_PROMPT,{
                prompt:'Please Enter your Employee ID.',
                retryPrompt:'Please enter a valid Employee ID.'
            });
        // }


    }

    async endPIStep(stepContext) {
        stepContext.values.employeeid = stepContext.result;
        return await stepContext.endDialog({
            data: stepContext.values
        });
    }

    validateName(name){
        return /^[a-zA-Z ]+$/.test( name);
    }
}

module.exports.PI = personalInformation;
