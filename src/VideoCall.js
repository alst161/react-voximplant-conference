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
            this.startCall()
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

    startCall(){
        this.call = this.voxAPI.callConference({number: 100, video: {sendVideo: true, receiveVideo: true}})
        this.call.on(VoxImplant.CallEvents.Connected, this.onCallConnected);
        this.call.on(VoxImplant.CallEvents.Disconnected, this.onCallDisconnected);
        this.call.on(VoxImplant.CallEvents.Failed, this.onCallFailed);
        this.call.on(VoxImplant.CallEvents.EndpointAdded, this.onEndpointAdded);

    }
    onCallConnected(e) {
        console.log(`[WebSDk] Call connected ID: ${e.call.id()}`);
    }

    onCallDisconnected(e) {
        console.log(`[WebSDk] Call ended ID: ${e.call.id()}`);
        this.call = null;
    }

    onCallFailed(e) {
        console.log(`[WebSDk] Call failed ID: ${e.call.id()}`);
        this.call = null;
    }

    onEndpointAdded(e) {
        console.log(`[WebSDk] New endpoint ID: ${e.endpoint.id} (${e.endpoint.isDefault?'default':'regular'}) for Call ID: ${e.call.id()}`);
        //Remove the display element with this endpoint
        e.endpoint.on(VoxImplant.EndpointEvents.Removed, this.onEndpointRemoved);
        e.endpoint.on(VoxImplant.EndpointEvents.RemoteMediaAdded, this.onRemoteMediaAdded);
        e.endpoint.on(VoxImplant.EndpointEvents.RemoteMediaRemoved, this.onRemoteMediaRemoved);
    }
    onEndpointRemoved(e) {
        console.log(`[WebSDk] Endpoint was removed ID: ${e.endpoint.id} (${e.endpoint.isDefault?'default':'regular'}) for Call ID: ${e.call.id()}`);
    }

    onRemoteMediaAdded(e) {
        console.log(`[WebSDk] New MediaRenderer ID: ${e.mediaRenderer.id} in ${e.endpoint.id} for Call ID: ${e.call.id()}`);
        const endpointNode = document.getElementById("call_remotevideo");
        if(endpointNode){
            e.mediaRenderer.render(endpointNode);
        }
    }

    onRemoteMediaRemoved(e) {
        console.log(`[WebSDk] MediaRenderer was removed ID: ${e.mediaRenderer.id} in ${e.endpoint.id} for Call ID: ${e.call.id()}`);
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