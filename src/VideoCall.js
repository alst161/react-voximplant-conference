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
        this.voxAPI.on(VoxImplant.Events.IncomingCall, (e) => this.voxIncomingCall(e));
        /*this.voxAPI.on(VoxImplant.Events.MicAccessResult, (e) => this.voxMicAccessResult(e));*/


    }

    init() {
        try {
            this.voxAPI.init({
                remoteVideoContainerId: "call_remote_video"
            });
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
        console.log(this.props.login)
        this.voxAPI.requestOneTimeLoginKey(this.props.login+"@conference.arizukiii.voximplant.com");
    }

    voxIncomingCall(e){
        console.log(`[WebSDk] New incoming call with ID: ${e.call.id()}`);
        if(this.call){
            console.log('[WebSDk] You already have active call. Hangup;');
            e.call.hangup();
        }else{
            this.call = e.call;
            this.call.on(VoxImplant.CallEvents.Connected, this.onCallConnected);
            this.call.on(VoxImplant.CallEvents.Disconnected, this.onCallDisconnected);
            this.call.on(VoxImplant.CallEvents.Failed, this.onCallFailed);
            this.call.on(VoxImplant.CallEvents.EndpointAdded, this.onEndpointAdded);
            this.call.answer();
        }

    }

    voxConnectionFailed(e) {
        console.log("Connectioned failed");
        console.log(e)
    }

    voxConnectionClosed(event) {
        console.log("Connectioned closed");
    }

    voxAuthEvent(event) {
        console.log(`[WebSDk] Auth: ${event.displayName}`);
        console.log(event);
        if (event.result) {
            this.displayName = event.displayName;
            this.startCall()
        } else {
            if (event.code === 302) {
                const mypass = 'SECUREPASSWORD';
                const appName = 'conference';
                const account = 'arizukiii';
                const login = this.props.login;
                console.log(`[WebSDk] Login: ${login}`);
                const URI = `${login}@${appName}.${account}.voximplant.com`;
                const token = md5(`${event.key}|${md5(`${login}:voximplant.com:${mypass}`)}`);
                VoxImplant.getInstance().loginWithOneTimeKey(URI, token);
                console.log("302")
            } else {
                console.log(`[WebSDk] Auth err: ${event.code}`);
            }
        }

    }

    startCall(){
        this.call = this.voxAPI.callConference({number: 111, video: {sendVideo: true, receiveVideo: true}})
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
        e.endpoint.on(VoxImplant.EndpointEvents.RemoteMediaAdded, (event) => {
            console.log(event)
        });
        e.endpoint.on(VoxImplant.EndpointEvents.InfoUpdated,(event) => this.onInfoUpdate(event));
        e.endpoint.on(VoxImplant.EndpointEvents.Removed, (event) => {
            console.log(`[WebSDk] New MediaRenderer ID: ${e.mediaRenderer.id} in ${e.endpoint.id} for Call ID: ${e.call.id()}`);
            const endpointNode = document.getElementById("call_remote_video");
            if(endpointNode){
                console.log(endpointNode)
                e.mediaRenderer.render(endpointNode);
            }
        });
        e.endpoint.on(VoxImplant.EndpointEvents.RemoteMediaRemoved, (event) => this.onRemoteMediaRemoved(event));
    }
    onInfoUpdate(e){
        console.log(e)
    }
    onEndpointRemoved(e) {
        console.log(`[WebSDk] Endpoint was removed ID: ${e.endpoint.id} (${e.endpoint.isDefault?'default':'regular'}) for Call ID: ${e.call.id()}`);
    }

    onRemoteMediaAdded(e) {
        console.log(`[WebSDk] New MediaRenderer ID: ${e.mediaRenderer.id} in ${e.endpoint.id} for Call ID: ${e.call.id()}`);
        const endpointNode = document.getElementById("call_remote_video");
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
                    <div id="call_remote_video" style={{width:"300px",height:"300px"}}/>
                </div>
            )
    }
}

export default VideoCall;