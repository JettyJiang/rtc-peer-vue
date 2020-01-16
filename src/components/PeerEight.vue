<template>
  <div class="peereight">
    <div class="myaudio">
      <audio id="peer2Audio" crossorigin="anonymous" autoplay="autoplay" controls="controls" controller="true"></audio>
    </div>
    <div class="mybutton">
      <button class="stop"  v-bind:disabled="disstop">Stop</button>
    </div>
    <div class="sttresult" ref="subInfo"></div>
    <div id="audios-container"></div>
    <section class="sound-clips">


    </section>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'PeerEight',
  data () {
    return {
      wss:'',
      WSS_URL:"wss://sttext.platformerfuji.com/wss",
      disstop:true,
      peer2:'',
      started:false,
      mediaRecorder:'',
      name: 'peer8'
    }
  },
  mounted() {
    let peer2Audio = document.getElementById('peer2Audio');
    peer2Audio.addEventListener('loadedmetadata', function () {

    });
    let adapterScript = document.createElement('script');
    adapterScript.setAttribute('src', '/static/js/adapter-latest.js');
    document.head.appendChild(adapterScript);
    let mediaScript = document.createElement('script');
    mediaScript.setAttribute('src', '/static/js/MediaStreamRecorder.js');
    document.head.appendChild(mediaScript);
  },
  created() {
    let that = this;
    this.wss = new WebSocket(this.WSS_URL);
    console.log(this.wss);
    this.wss.onopen = function () {
      that.onOpen();
    };
    this.wss.onmessage = function (e) {
      that.onMessage(e);
    };
    this.wss.onclose = function () {
      console.log("ws close");
      //connect();
    };
    this.wss.onerror = function () {
      console.log("ws error");
    };
    this.onStart();

    //this.onTest();
  },
  methods: {
    onOpen() {
      var loginData = {
        "type": "login",
        "user": "peer8"
      };
      console.log(loginData);
      //添加状态判断，当为OPEN时，发送消息
      if (this.wss.readyState===1) {
        this.wss.send(JSON.stringify(loginData));
      }

    },
    onMessage(e) {
      let that = this;
      var data = JSON.parse(e.data);
      if (data.user == name) {
        return;
      }
      if (data.type != 'ping' && data.user != 'peer7') {
        return;
      }
      var msg = data['message'];
      switch (data['type']) {
        case 'ping':
        this.wss.send('{"type":"pong"}');
        break;
        case 'offer':
        if (!this.started) {
          this.onStart();
        }
        var tmpmsg = new RTCSessionDescription(msg);
        console.log(tmpmsg);
        this.peer2.setRemoteDescription(tmpmsg);
        // peer2.setRemoteDescription(new RTCSessionDescription(msg));
        this.doAnswer();
        break;
        case 'answer':
        var tmpmsg = new RTCSessionDescription(msg);
        console.log(tmpmsg);
        this.peer2.setRemoteDescription(tmpmsg);
        // peer2.setRemoteDescription(new RTCSessionDescription(msg));
        break;
        case 'candidate':
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: msg.label,
          candidate: msg.candidate
        });
        this.peer2.addIceCandidate(candidate);
        break;
        case 'hangup':
        // stop record
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.stop();
        this.peer2.close();
        this.peer2 = null;
        this.started = false;
        break;
      }
    },
    onStart() {
      let that = this;
      var servers = {
        "iceServers": [
          {
            "urls": [
              "stun:turn.platformerfuji.com",
            ]
          },
          {
            "urls": [
              "turn:turn.platformerfuji.com?transport=udp",
              "turn:turn.platformerfuji.com?transport=tcp"
            ],
            "credential": "3edc$RFV",
            "username": "snail"
          }
        ],
        "blockStatus": "NOT_BLOCKED",
        "iceTransportPolicy": "all"
      };
      this.peer2 = new RTCPeerConnection(servers);
      console.log('Created peer connection object peer8');
      //this.peer2.onicecandidate = onIceCandidate;
      this.peer2.onicecandidate = function (e) {
        that.onIceCandidate(e);
      };
      this.peer2.oniceconnectionstatechange = function (e) {
        that.onIceStateChange(e);
      };
      this.peer2.onconnecting = that.onSessionConnecting();
      this.peer2.onopen = that.onSessionOpened();
      //this.peer2.onaddstream = onRemoteStreamAdded;
      this.peer2.onaddstream = function (e) {
        that.onRemoteStreamAdded(e);
      };
      this.started = true;
    },
    onIceCandidate(event) {
      console.log("onIceCandidate" + JSON.stringify(event));
      if (event.candidate) {
        this.sendMessage(event.candidate, 'candidate');
      }
    },
    onSessionConnecting() {
      console.log('onSessionConnecting');
    },
    onSessionOpened() {
      console.log('onSessionOpened');
    },
    onRemoteStreamAdded(e) {
      var peer2Audio = document.getElementById('peer2Audio');
      var stream = e.stream;
      console.log("stream:" + stream);
      // let remoteStream = new wrtc.MediaStream(stream.audioTracks);
      let remoteStream = stream;

      peer2Audio.srcObject = remoteStream;
      // console.log("event:" + JSON.stringify(event));
      console.log("stream:" + remoteStream);
      var mediaStreamTracks = stream.getTracks();
      console.log('------mediaStreamTracks----');
      console.log(mediaStreamTracks);
      console.log('----mediaStreamTracks[0]----');
      console.log(mediaStreamTracks[0]);
      this.audioFile(remoteStream);
    },
    onAddIceCandidateSuccess(pc) {
      console.log('addIceCandidate success');
    },
    onAddIceCandidateError(pc, error) {
      console.log('failed to add ICE Candidate: ' + error.toString());
    },
    onIceStateChange(event) {
      console.log('ICE state change event: ', event);
    },
    doAnswer() {
      let that = this;
      console.log('Sending answer to peer.');
      this.peer2.createAnswer(that.setLocalAndSendMessage,that.onCreateSessionDescriptionError);
    },
    onCreateSessionDescriptionError(error) {
      console.log('Failed to create session description: ' + error.toString());
    },
    setLocalAndSendMessage(sessionDescription) {
      sessionDescription.sdp = this.forceChosenAudioCodec(sessionDescription.sdp);
      this.peer2.setLocalDescription(sessionDescription);
      console.log("send answer to peer1");
      this.sendMessage(sessionDescription);
    },
    sendMessage(message) {
      var msg = {};
      msg.user = this.name;
      msg.type = message.type;
      msg.message = message;
      // message.user = name;
      var msgString = JSON.stringify(msg);
      this.wss.send(msgString);
    },
    audioFile(stream) {
      var mediaConstraints = {audio: true};
      // navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
      this.onSuccess(stream);
      this.onError(e)
      // navigator.mediaDevices.getUserMedia(mediaConstraints).then(onSuccess, onError);
    },
    onSuccess(stream) {
      let that = this;
      this.mediaRecorder = new MediaStreamRecorder(stream);
      this.mediaRecorder.stream = stream;
      this.mediaRecorder.mimeType = 'audio/wav'; // audio/webm or audio/ogg or audio/wav

      // mediaRecorder.recorderType = StereoAudioRecorder;
      this.mediaRecorder.ondataavailable = function (blob) {
        // POST/PUT "Blob" using FormData/XHR2
        var blobURL = window.URL.createObjectURL(blob);
        var a = '<a href="' + blobURL + '">' + blobURL + '</a>';
        console.log(blobURL);
        var fileName = (Math.random() * 1000).toString().replace('.', '') + '.wav';
        var formData = new FormData();
        // var fileType = blob.type.split('/')[0] || 'audio';
        formData.append('audio-filename', fileName);
        formData.append('audio-blob', blob);
        formData.append('language', 'ja-JP');


        axios.post('https://sttext.platformerfuji.com/savepeer.php',formData
        ).then(res =>{
          //获取你需要的数据
          console.log(res);
          that.$refs.subInfo.innerHTML= res.data;
          let textResMessage = {
                  "type": 'text',
                  "msg": res.data
          };
          that.sendMessage(textResMessage);
        });

        // $.ajax({
        //   url: 'savepeer.php', /*接口域名地址*/
        //   type: 'post',
        //   data: formData,
        //   contentType: false,
        //   processData: false,
        //   dataType: 'json',
        //   success: function (res) {
        //     //$('.sttresult').append(res);
        //     this.$refs.subInfo.innerHTML= res
        //     let textResMessage = {
        //       "type": 'text',
        //       "msg": res
        //     };
        //     that.sendMessage(textResMessage);
        //   }
        // })

      };
      this.mediaRecorder.onstop = function (e) {
        console.log("data available after MediaRecorder.stop() called.");
      }
      this.mediaRecorder.start(3000);
    },
    onError(e) {
      //console.error('media error', e);
    },
    forceChosenAudioCodec(sdp) {
      return this.maybePreferCodec(sdp, 'audio', 'send', 'opus');
    },
    // Sets |codec| as the default |type| codec if it's present.
    // The format of |codec| is 'NAME/RATE', e.g. 'opus/48000'.
    maybePreferCodec(sdp, type, dir, codec) {
      var str = type + ' ' + dir + ' codec';
      if (codec === '') {
        return sdp;
      }

      var sdpLines = sdp.split('\r\n');

      // Search for m line.
      var mLineIndex = this.findLine(sdpLines, 'm=', type);
      if (mLineIndex === null) {
        return sdp;
      }

      // If the codec is available, set it as the default in m line.
      var codecIndex = this.findLine(sdpLines, 'a=rtpmap', codec);
      console.log('codecIndex', codecIndex);
      if (codecIndex) {
        var payload = this.getCodecPayloadType(sdpLines[codecIndex]);
        if (payload) {
          sdpLines[mLineIndex] = this.setDefaultCodec(sdpLines[mLineIndex], payload);
        }
      }
      sdp = sdpLines.join('\r\n');
      return sdp;
    },

    // Find the line in sdpLines that starts with |prefix|, and, if specified,
    // contains |substr| (case-insensitive search).
    findLine(sdpLines, prefix, substr) {
      return this.findLineInRange(sdpLines, 0, -1, prefix, substr);
    },

    // Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
    // and, if specified, contains |substr| (case-insensitive search).
    findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
      var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
      for (var i = startLine; i < realEndLine; ++i) {
        if (sdpLines[i].indexOf(prefix) === 0) {
          if (!substr ||
            sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
            return i;
          }
        }
      }
      return null;
    },

    // Gets the codec payload type from an a=rtpmap:X line.
    getCodecPayloadType(sdpLine) {
      var pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
      var result = sdpLine.match(pattern);
      return (result && result.length === 2) ? result[1] : null;
    },

    // Returns a new m= line with the specified codec as the first one.
    setDefaultCodec(mLine, payload) {
      var elements = mLine.split(' ');
      // Just copy the first three parameters; codec order starts on fourth.
      var newLine = elements.slice(0, 3);
      // Put target payload first and copy in the rest.
      newLine.push(payload);
      for (var i = 3; i < elements.length; i++) {
        if (elements[i] !== payload) {
          newLine.push(elements[i]);
        }
      }
      return newLine.join(' ');
    },

    // onTest(){
    //   let that = this;
    //   let formData = new FormData();
    //   // var fileType = blob.type.split('/')[0] || 'audio';
    //   formData.append('audio-filename', '123');
    //   formData.append('audio-blob', '456');
    //   formData.append('language', 'ja-JP');
    //   axios.post('https://sttext.platformerfuji.com/savepeer.php',formData
    //   ).then(res =>{
    //     console.log(res)
    //     //获取你需要的数据
    //     that.$refs.subInfo.innerHTML= res.data;
    //     let textResMessage = {
    //       "type": 'text',
    //       "msg": res
    //     };
    //     //that.sendMessage(textResMessage);
    //   });
    // }






  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .myaudio{
    width: 60%;
    text-align: left;
  }
  .mybutton{
    text-align: left;
  }
</style>
