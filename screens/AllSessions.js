import React, { Component } from 'react';

import {
    ScrollView,
    View,
    Text,
    TextInput,
    FlatList,
    SectionList,
} from 'react-native';

import { StorageConsumer } from '../storage/StorageProvider';

import styles from '../styles/styles';

import createNavigationOptions from '../navigation/navigation-options';

import SessionTile from '../components/SessionTile';

import filterSessions from '../utils/filters';

import { extractSessionType } from '../utils/sessions';


const sessionsByDay = [
    {
        day: "Friday",
        keynoteIndeces: [0, 1],
        breakoutNames: [
            'BREAKOUT 1',
            'BREAKOUT 2',
            'BREAKOUT 3',
        ],
    },
    {
        day: "Saturday",
        keynoteIndeces: [2, 3],
        breakoutNames: [
            'BREAKOUT 4',
            'BREAKOUT 5',
            'BREAKOUT 6',
        ],
    },
];


export default class AllSessions extends Component {

    static navigationOptions = createNavigationOptions("All Sessions");

    state = {
        input: "",
    };

    toggleDay = day => this.setState({ [day]: !this.state[day] });

    render = () => {
        const {
            state,
            state: {
                input,
            },
            props: {
                navigation,
            },
        } = this;
        return (
            <ScrollView>
                <View
                    style={styles.view}
                >
                    <Text>Search</Text>
                    <TextInput
                        clearButtonMode="always"
                        style={styles.searchInput}
                        value={input}
                        onChangeText={input => this.setState({ input })}
                    />
                    <FlatList
                        keyExtractor={(_, i) => `${i}`}
                        data={sessionsByDay}
                        extraData={state}
                        renderItem={({ item }) => (
                            <Day
                                {...item}
                                input={input}
                                navigation={navigation}
                            />
                        )}
                    />
                </View>
            </ScrollView>
        );
    }
}

function Day({
    input,
    day,
    keynoteIndeces: [k1, k2],
    breakoutNames,
    navigation,
}) {
    const currentFilter = filterSessions({ state: { input } });
    return (
        <StorageConsumer>
            {({ keynotes, breakouts, schedule }) => {
                const [keynoteOne, keynoteTwo] = [k1, k2]
                    .map(n => keynotes
                        .find(({ sessiontype = '' }) => sessiontype
                            .includes(n)) || {})
                return (
                    <>
                        <Text style={[
                            styles.title,
                            styles.marginTopXxLarge,
                            styles.marginBottomXLarge,
                        ]} >{day}</Text>
                        <View
                            style={[
                                styles.breakoutHeader,
                                styles.marginBottomMedium,
                            ]}
                        >
                            <Text style={[
                                styles.h2,
                            ]} >Keynote {k1 + 1}</Text>
                            <Text style={[
                                styles.h4,
                            ]} >{keynoteOne.sessiontime || ''}</Text>
                        </View>
                        <SessionTile
                            display={currentFilter(keynoteOne)}
                            navigation={navigation}
                            session={keynoteOne}
                        />
                        <SectionList
                            keyExtractor={({ title, id }) => `${id} ${title}`}
                            sections={breakoutNames.map(name => ({
                                title: name,
                                data: breakouts[name] || [],
                            }))}
                            renderSectionHeader={({
                                section: {
                                    title,
                                    data: [
                                        {
                                            sessiontime = '',
                                        } = {},
                                    ],
                                },
                            }) => (
                                    <View
                                        style={[
                                            styles.breakoutHeader,
                                            styles.marginTopXxLarge,
                                            styles.marginBottomMedium,
                                        ]}
                                    >
                                        <Text style={[
                                            styles.h2,
                                        ]} >{extractSessionType({ sessiontype: title })}</Text>
                                        <Text style={[
                                            styles.h4,
                                        ]} >{sessiontime}</Text>
                                    </View>
                                )}
                            renderItem={({ item: session, section: { title } }) => (
                                <SessionTile
                                    display={currentFilter(session)}
                                    input={input}
                                    session={session}
                                    navigation={navigation}
                                    addedToSchedule={schedule[title]
                                        &&
                                        schedule[title].id === session.id}
                                />
                            )}
                        />
                        <View
                            style={[
                                styles.breakoutHeader,
                                styles.marginTopXxLarge,
                                styles.marginBottomMedium,
                            ]}
                        >
                            <Text style={[
                                styles.h2,
                            ]} >Keynote {k2 + 1}</Text>
                            <Text style={[
                                styles.h4,
                            ]} >{keynoteTwo.sessiontime || ''}</Text>
                        </View>
                        <SessionTile
                            display={currentFilter(keynoteTwo)}
                            navigation={navigation}
                            session={keynoteTwo}
                        />
                    </>
                );
            }}
        </StorageConsumer>
    );
}
