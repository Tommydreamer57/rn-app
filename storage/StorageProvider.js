import React, {
    Component,
    createContext,
} from 'react';

import OneSignal from 'react-native-onesignal';

import {
    log,
    getItem,
    getItems,
    submitReview,
    refetchSessionsEachDay,
    handleReceivedNotification,
} from './service';

import {
    Alert,
    AsyncStorage,
} from 'react-native';

export const StorageContext = createContext();

const { Provider, Consumer } = StorageContext;

export const StorageConsumer = Consumer;

const scheduleKeys = [
    "KEYNOTE 1",
    "BREAKOUT 1",
    "BREAKOUT 2",
    "BREAKOUT 3",
    "KEYNOTE 2",
    "KEYNOTE 3",
    "BREAKOUT 4",
    "BREAKOUT 5",
    "BREAKOUT 6",
    "KEYNOTE 4",
];

const transformSchedule = schedule => scheduleKeys.map(key => ({
    sessionName: key,
    selectedSession: schedule[key],
}));

export default class StorageProvider extends Component {

    state = {
        allSessions: {},
        scheduleArray: [],
        schedule: {},
        breakouts: {},
        keynotes: [],
        speakers: {},
        notifications: [],
        addToSchedule() { },
        removeFromSchedule() { },
        submitReview() { },
        deleteNotification() { },
    };

    /**
     * I'm not sure I know what's wrong actually,
     * This component wraps the entire app and so it is always mounted.
     * When it mounts, it gets all the notifications from asyncstorage.
     * Then it handles receiving a new notification when one comes in while the app is open.
     * 
     * What old notification?
     */

    // this lifecycle hook receive prevProps and prevState as arguments. 
    // oldnotification is the one from prvious props

    componentWillUnmount() {
        OneSignal.removeEventListener('received', this.receiveNotification);
        OneSignal.removeEventListener('opened', this.onOpened);
        OneSignal.removeEventListener('ids', this.onIds);
        clearInterval(this.interval);
    }

    componentDidMount = async () => {

        OneSignal.init("d8ca736c-86df-4151-9df8-2fbfecf81436");

        OneSignal.addEventListener('received', this.receiveNotification);
        OneSignal.addEventListener('opened', this.onOpened);
        OneSignal.addEventListener('ids', this.onIds);

        await refetchSessionsEachDay();

        const [schedule, breakouts, keynotes, speakers, notifications] = await getItems("schedule", "breakouts", "keynotes", "speakers", "notifications");

        const scheduleArray = transformSchedule(schedule);

        const allSessions = {
            ...Object.values(breakouts)
                .reduce((all, breakout) => [...all, ...breakout], [])
                .concat(keynotes)
                .reduce((all, session) => ({
                    ...all,
                    [session.id]: session
                }), {}),
        };

        this.setState({
            allSessions,
            scheduleArray,
            schedule,
            breakouts,
            keynotes,
            speakers,
            notifications,
            addToSchedule: this.addToSchedule,
            removeFromSchedule: this.removeFromSchedule,
            deleteNotification: this.deleteNotification,
            submitReview,
        });
    }

    addToSchedule = async id => {
        const session = this.state.allSessions[id];
        const sessionName = session.sessiontype.toUpperCase();
        const schedule = {
            ...this.state.schedule,
            [sessionName]: session,
        };
        try {
            await AsyncStorage.setItem("schedule", JSON.stringify(schedule));
            const scheduleArray = transformSchedule(schedule);
            this.setState({
                schedule,
                scheduleArray,
            });
        } catch (err) {
            console.error(err);
        }
    }

    removeFromSchedule = async id => {
        const session = this.state.allSessions[id];
        const sessionName = session.sessiontype.toUpperCase();
        const schedule = {
            ...this.state.schedule,
            [sessionName]: {},
        };
        try {
            await AsyncStorage.setItem("schedule", JSON.stringify(schedule));
            const scheduleArray = transformSchedule(schedule);
            this.setState({
                schedule,
                scheduleArray,
            });
        } catch (err) {
            console.error(err);
        }
    }

    deleteNotification = async id => {
        const notifications = this.state.notifications
            .filter(({ notificationID }) => notificationID !== id);

        try {
            await AsyncStorage.setItem("notifications", JSON.stringify(notifications));
            this.setState({ notifications });
        } catch (err) {
            console.error(err);
        }
    }

    receiveNotification = async notification => {
        try {
            const notifications = await handleReceivedNotification(notification);

            if (notifications) this.setState({ notifications });
        } catch (err) {
            console.error(err);
        }
    }

    onOpened(openResult) { }

    onIds(device) {
        console.log('Device info: ', device);
    }

    render = () => (
        <Provider
            value={this.state}
        >
            {this.props.children}
        </Provider>
    );
}
