import React, {Component} from 'react'
import * as VoxImplant from 'voximplant-websdk';
import md5 from 'md5';

class VideoCall extends Component{
    constructor(props) {
        super(props);

        this.call = null;
        this.voxAPI = VoxImplant.getInstance();
        this.voxAPI.on(VoxImplant.Events.SDKReady, (e) => this.voxReady(e));
        this.voxAPI.on(VoxImplant.Events.ConnectionEstablished, (e) => this.voxConnectionEstablished(e));
        this.voxAPI.on(VoxImplant.Events.ConnectionFailed, (e) => this.voxConnectionFailed(e));
        this.voxAPI.on(VoxImplant.Events.ConnectionClosed, (e) => this.voxConnectionClosed(e));
        this.voxAPI.on(VoxImplant.Events.AuthResult, (e) => this.voxAuthEvent(e));
        this.voxAPI.on(VoxImplant.Events.MicAccessResult, (e) => this.voxMicAccessResult(e));
        /*this.voxAPI.on(VoxImplant.Events.IncomingCall, (e) => this.voxIncomingCall(e));*/


    }

    init() {
        try {
            this.voxAPI.init({
                micRequired: true,
                videoSupport: true,
                localVideoContainerId: "call_localvideo"
            });
            this.voxAPI.showLocalVideo(true)
        } catch(e) {
            this.setState({
                msg: "Необходим браузер с поддержкой технологии WebRTC, воспользуйтесь, пожалуйста, Chrome/Chromium, Firefox или Opera"
            });
        }
    }

    voxReady(event) {
        console.log("VoxImplant WebSDK Ready v. " + event.version);
        console.log(this.voxAPI.isRTCsupported());
        if (!this.voxAPI.isRTCsupported()) {
            this.setState({
                msg: "Необходим браузер с поддержкой технологии WebRTC, воспользуйтесь, пожалуйста, Chrome/Chromium, Firefox или Opera"
            });
        }else {
            this.voxAPI.connect(false);
        }
    }

    voxConnectionEstablished(event) {
        console.log("VoxImplant connected");
        this.setState({  msg: "Авторизация..." });
        this.voxAPI.requestOneTimeLoginKey(this.props.login+"@test.arizukiii.voximplant.com");
    }

    voxConnectionFailed(e) {
        console.log("Connectioned failed");
        console.log(e)
        this.setState({
            msg: "Соединение не может быть установлено"
        });
    }

    voxConnectionClosed(event) {
        console.log("Connectioned closed");
        this.setState({
            msg: "Соединение было закрыто"
        });
    }

    voxAuthEvent(event) {
        if (event.result) {
            this.displayName = event.displayName;
            this.call = this.voxAPI.callConference({number: this.props.calledr, video: {sendVideo: true, receiveVideo: true}})
        } else {
            if (event.code === 302) {
                const mypass = 'SECUREPASSWORD';
                const appName = 'conference';
                const account = 'arizukiii';
                const login = this.props.login;
                const URI = `${login}@${appName}.${account}.voximplant.com`;
                const token = md5(`${event.key}|${md5(`${login}:voximplant.com:${mypass}`)}`);
                VoxImplant.getInstance().loginWithOneTimeKey(URI, token);
                console.log("302")
            } else {
                this.setState({
                    msg: "Ошибка авторизации"
                });
            }
        }

    }

    componentDidMount() {
        this.init()
    }

    render() {
        return(
                <div>
                    <div id="call_localvideo" style={{width:"300px",height:"300px"}}/>
                    <div id="call_remotevideo" style={{width:"300px",height:"300px"}}/>
                </div>
            )
    }
}

export default VideoCall;