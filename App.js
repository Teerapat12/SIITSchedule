import React from 'react';
import {SectionList,FlatList, StyleSheet, Text, View, TextInput ,Alert,Image} from 'react-native';
import { Container, Header, Left,Right,Body,Title, Content, Tab, Tabs ,Icon,Form, Item, Input, Label,Button,List, ListItem,H1, H2,} from 'native-base';
import moment from 'moment';
import Expo from "expo";

const convertDay = {
    'Mon':"Monday",
    'Tue':'Tuesday',
    'Wed':'Wednesday',
    'Thu':'Thursday',
    'Fri':'Friday',
    'Sat':'Satuday',
    'Sun':'Sunday'
};






export default class App extends React.Component {



    constructor(props) {
        super(props);
        this.state = {
            studentId:'',
            courses:[],
            exams:[],
            curTime : new Date().toLocaleString(),
            isReady:false,
            openInput:false,
            text:'',
            whichTerm:'mid',
            leftUnit:'days',
            nextSubject:'',
        };
    }

    async componentWillMount() {
        await Expo.Font.loadAsync({
            Roboto: require("native-base/Fonts/Roboto.ttf"),
            Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
            Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf")
        });

        this.setState({ isReady: true });
    }

    loadNewSchedule(id){
        fetch(`http://reg.siit.tu.ac.th/registrar/learn_time.asp?studentid=${id}&f_cmd=2`)
            .then((response)=>{

                if(response["_bodyInit"].indexOf("DATA OF STUDENT'S TIMETABLE NOT BE FOUND")>-1){
                    Alert.alert('Please try again.','Student Id not found!');
                    this.setState({openInput:true});
                }
                let m;
                let currentDate = {};
                const courses = [];

                // const regex = /\<font face=tahoma>(.*?)<\/a><\/b><font color=#000000><BR>(.*?)<BR>(.*?)<BR>(.*?)<\/TD>/g;
                const regex = /(Size=1><B>(.*?)<\/TD>)|(TITLE="(.*?)"><font face=tahoma>(.*?)<\/a><\/b><font color=#000000><BR>(.*?)<BR>(.*?)<BR>(.*?)<\/TD>)/g;
                let DOW = 'Mon';
                while ((m = regex.exec(response["_bodyInit"])) !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }

                    if(m[1]!=undefined){ //This is the day of the week
                        courses.push({...currentDate});
                        DOW = m[2];
                        currentDate['title'] = m[2];
                        currentDate['data'] = [];

                    }
                    else {
                        // The result can be accessed through the `m`-variable.
                        const course = {};

                        course['title'] = m[4];
                        course['code'] = m[5];
                        course['credit'] = m[6].split(")")[0][1];
                        course['section'] = m[6].split(" ")[1].split(",")[0];
                        course['location'] = m[6].split(" ")[2];
                        course['room'] = m[6].split(" ")[3];
                        course['building'] = m[7];
                        course['time'] = m[8];
                        course['day'] = DOW;

                        currentDate['data'].push(course);

                        // courses.push(course);
                    }



                    // m.forEach((match, groupIndex) => {
                    //     console.log(`Found match, group ${groupIndex}: ${match}`);
                    // });
                }
                courses.push({...currentDate});
                courses.shift();
                this.setState({courses:courses,text:''});


                const regex2 = /<TR VALIGN=TOP><TD>&nbsp;&nbsp;(.*?)&nbsp;&nbsp;<\/TD><TD>(.*?)<\/TD><TD ALIGN=CENTER>(.*?)<\/TD><TD ALIGN=CENTER>(.*?)<\/TD><TD ALIGN=CENTER>(.*?)<\/TD>(.*?)<TD ALIGN=CENTER>(.*?)<\/TD><TD ALIGN=CENTER>(.*?)<\/TD><\/TR>/g;
                const exams = [];
                let n;

                while ((n = regex2.exec(response["_bodyInit"])) !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (n.index === regex2.lastIndex) {
                        regex2.lastIndex++;
                    }

                    // The result can be accessed through the `m`-variable.
                    n.forEach((match, groupIndex) => {
                        console.log(`Found match, group ${groupIndex}: ${match}`);
                    });


                    const exam = {};
                    if(n[4]!='-' && n[7]!='-') {
                        exam['code'] = n[1];
                        exam['fullname'] = n[2];
                        exam['mid_date'] = n[4].split("<BR>TIME")[0].split(") ")[1];
                        exam['mid_time'] = n[4].split("TIME ")[1].split("<BR>")[0];
                        exam['mid_start'] = moment(exam['mid_date']+" "+exam['mid_time'].split("-")[0],"DD MMM YYYY kk:mm");
                        exam['fin_date'] = n[7].split("<BR>TIME")[0].split(") ")[1];
                        exam['fin_time'] = n[7].split("TIME ")[1].split("<BR>")[0];
                        exam['fin_start'] = moment(exam['fin_date']+" "+exam['fin_time'].split("-")[0],"DD MMM YYYY kk:mm");
                        exams.push({...exam});
                    }


                }

                exams.sort((a,b)=>{
                    if(a['mid_start'].isBefore(b['mid_start'])) return -1;
                    else if(b['mid_start'].isBefore(a['mid_start'])) return 1;
                    else return 0;
                });

                if(exams[exams.length-1]['mid_start'].isBefore(moment(new Date()))){ //If last subject of midterm exam already pass...

                    this.setState({whichTerm:"fin"});
                    exams.sort((a,b)=>{
                        if(a['fin_start'].isBefore(b['fin_start'])) return -1;
                        else if(b['fin_start'].isBefore(a['fin_start'])) return 1;
                        else return 0;
                    });
                }
                var i=0;
                var nextExam = exams[0];
                var now = moment(new Date());
                while(nextExam[`${this.state.whichTerm}_start`].isBefore(now)&&i<exams.length){
                    i+=1;
                    nextExam = exams[i];
                }
                if(i==exams.length){
                    Alert.alert('Congrats!!','You just finish your exam');
                }

                var amountLeft = nextExam[`${this.state.whichTerm}_start`].diff(now,'days');

                if(amountLeft<2){ //If too close, check hour instead;
                    this.setState({leftUnit:'hours'});
                    amountLeft = nextExam[`${this.state.whichTerm}_start`].diff(now,'hours');

                }
                this.setState({exams,amountLeft,nextSubject:nextExam['fullname']+" ("+nextExam['code']+")"});
            })
            .catch((error)=>{
                console.log(error);
            });
    }

    componentDidMount(){
        setInterval( () => {
            this.setState({
                curTime : new Date().toLocaleString()
            })
        },1000);

        this.loadNewSchedule('5722780046');

    }




    render() {

        if (!this.state.isReady) {
            return <View><Text>Loading..</Text></View>;
        }
        const {courses,exams,whichTerm,leftUnit,amountLeft} = this.state;
        var begin = moment(new Date()).startOf('week');
        var now = moment(new Date());
        return (

            <Container>
                <Header hasTabs >
                    <Left>
                        {this.state.openInput?
                            <Button
                                onPress={() => { this.setState({openInput:false})}}
                                transparent
                            >
                                <Icon name='md-arrow-back' />
                            </Button>:null}
                    </Left>
                    <Body>
                    <Title>SIIT Schedule</Title>
                    </Body>
                    <Right>
                        <Button transparent
                                onPress={() => {  this.setState({openInput:true})}}
                        >
                            <Icon name="md-settings" />
                        </Button>
                    </Right>

                </Header>
                {this.state.openInput?
                    <Form >
                        <Item floatingLabel>
                            <Label>Student Id</Label>
                            <Input
                                onChangeText={(text) => {this.setState({text}); }}
                                value={this.state.text}
                                keyboardType = 'numeric'
                                style={styles.inputPage}
                            />
                        </Item>
                        <Button
                            onPress={()=>{this.loadNewSchedule(this.state.text); this.setState({openInput:false})}}
                        >
                            <Text>Sign in</Text>
                        </Button>
                    </Form>:
                    <Tabs initialPage={0}>
                        <Tab heading="Schedule">

                            <SectionList
                                sections={courses}
                                keyExtractor={(item, index) => index}
                                renderItem={({item}) =>{
                        //Is this course already in the past or not.
                        const alreadyLearn = begin.clone().day(convertDay[item.day]).isBefore(moment(new Date())); //moment("9/8/17","DD/MM/YY")
                        return (
                                <View style={alreadyLearn?styles.sectionBodyDisabled:styles.sectionBody} key={item.code}>
                                    <View  style={styles.bodyLeft}>
                                    <Text style={styles.item}>{item.code}</Text>
                                    <Text style={styles.bodyTitle}>{item.title}</Text>
                                    </View>
                                    <View  style={styles.bodyRight}>
                                    <Text style={styles.bodyLocText}>{item.location+" "+item.room}</Text>
                                    <Text style={styles.bodyTimeText}>{item.time}</Text>
                                    </View>
                                </View>
                        )
                    }
                    }
                                renderSectionHeader={({section}) => <Text key={section.title} style={styles.sectionHeader}>{section.title}</Text>}
                            />
                        </Tab>
                        <Tab heading="Test Schedule">
                            <Image style={styles.timeBorder}
                                   source={{uri: 'https://www.walldevil.com/wallpapers/a31/background-animated-dream-explore.jpg'}}
                            >

                                <Text style={styles.howmanyLeftStyle}>{this.state.amountLeft}</Text>
                                <Text style={styles.unitStyle}>{leftUnit} left</Text>
                                {leftUnit!='days'?<Text style={styles.nextSubject}>{this.state.nextSubject}</Text>:null}
                            </Image>
                            <FlatList
                                data={exams}
                                keyExtractor={(item, index) => index}
                                renderItem={({item}) =>{
                                const notTakeYet = moment(new Date()).isBefore(moment(item[`${this.state.whichTerm}_start`])); //moment("9/8/17","DD/MM/YY")
                                    return (

                                        <View style={notTakeYet?styles.sectionBody:styles.sectionBodyDisabled} key={item.code}>
                                            <View  style={styles.bodyLeft}>
                                            <Text style={styles.item}>{item.code}</Text>
                                            <Text style={styles.bodyTitle}>{item.fullname}</Text>
                                            </View>
                                            <View  style={styles.bodyRight}>
                                            <Text style={styles.bodyDOWText}>{item[`${this.state.whichTerm}_start`].format("dddd")}</Text>
                                            <Text style={styles.bodyLocText}>{item[`${this.state.whichTerm}_start`].format("DD MMM YY")}</Text>
                                            <Text style={styles.bodyTimeText}>{item[`${this.state.whichTerm}_time`]}</Text>
                                            </View>
                                        </View>)
                                        }
                                }
                            />
                        </Tab>
                    </Tabs>
                }
            </Container>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 22
    },
    sectionHeader: {
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: 'rgba(247,247,247,1.0)',
    },
    sectionBody:{
        borderWidth: 0.5,
        borderColor: '#e0e0e0',

        flexDirection: 'row',
    },
    sectionBodyDisabled:{
        borderWidth: 0.5,
        borderColor: '#EEEEEE',
        backgroundColor:'#e0e0e0',
        flexDirection: 'row',
    },
    bodyLeft:{
        flex:1,
        width:70,
        overflow:'hidden',
        padding:10
    },
    bodyRight:{
        // flex:1,
        alignSelf:'flex-end',
        padding:10
    },
    bodyTitle:{
        fontSize:15,

    },
    bodyDOWText:{
        fontSize:16,
        textAlign:'right'

    },
    bodyLocText:{
        fontSize:16,
        textAlign:'right'

    },
    bodyTimeText:{
        fontSize:15,
        textAlign:'right'

    },
    item: {
        fontSize: 18,
        height: 44,
    },
    inputPage:{
        paddingLeft:20
    },
    howmanyLeftStyle:{
        fontSize:60,
        color:'white',
        textAlign:'center',
        paddingLeft:20,
        paddingRight:20,
        paddingTop:20,
        paddingBottom:5
    },
    unitStyle:{
        fontSize:15,
        color:'white',
        textAlign:'center',
        marginBottom:10
    },
    timeBorder:{
        borderWidth: 0.5,
        borderColor: '#EEEEEE',
        backgroundColor:'#e0e0e0',
        paddingBottom:10
    },
    nextSubject:{
        fontSize:20,
        color:'white',
        textAlign:'center',

    }
});
