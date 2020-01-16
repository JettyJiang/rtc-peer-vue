<template>
  <div class="hello">
    <div class="myaudio">
      <audio id="peer1Audio" crossorigin="anonymous" autoplay="autoplay" controls="controls" controller="true"></audio>
    </div>
    <div class="mytext">
      <div class="mybutton">
        <button id="startButton" v-bind:disabled="disstart" @click="onStart()">Start</button>
        <button id="callButton" v-bind:disabled="discall" @click="onCall()">Call</button>
        <button id="hangupButton" v-bind:disabled="dishang" @click="onHang()">Hangup</button>
      </div>
      <textarea class="mytextarea" rows="20" cols="20" v-model="msg"></textarea>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'PeerSeven',
    data() {
      return {
        disstart: false,
        discall: true,
        dishang: true,
        localStream: '',
        peer1: '',
        wss: '',
        WSS_URL: "wss://sttext.platformerfuji.com/wss",
        ishangup: false,
        msg: '',
        name: 'peer7'
      }
    },
    mounted() {
      let peer1Audio = document.getElementById('peer1Audio');
      peer1Audio.addEventListener('loadedmetadata', function () {

      });
      let adapterScript = document.createElement('script');
      adapterScript.setAttribute('src', '/static/js/adapter.debug.js');
      document.head.appendChild(adapterScript);
    },
    // beforeRouteLeave(to,from,next){
    //   this.wss.onclose = function () {
    //     console.log("ws close");
    //   };
    // },
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
    },
    methods: {
      onOpen() {
        var loginData = {
          "type": "login",
          "user": "peer7"
        };
        console.log(loginData);
        //添加状态判断，当为OPEN时，发送消息
        if (this.wss.readyState === 1) {
          this.wss.send(JSON.stringify(loginData));
        }

      },
      onMessage(e) {
        //console.log(e);
        let that = this;
        var data = JSON.parse(e.data);
        if (data.user == name) {
          return;
        }
        if (data.type != 'ping' && data.user != 'peer8') {
          return;
        }
        var msg = data['message'];
        switch (data['type']) {
          case 'ping':
            this.wss.send('{"type":"pong"}');
            break;
          case 'candidate':
            this.peer1.addIceCandidate(new RTCIceCandidate(msg), function () {
                that.onAddIceCandidateSuccess(this.peer1);
              },
              function (err) {
                that.onAddIceCandidateError(this.peer1, err);
              }
            );
            break;
          case 'offer':
            break;
          case 'answer' :
            var tmpmsg = new RTCSessionDescription(msg);
            console.log(tmpmsg);
            this.peer1.setRemoteDescription(tmpmsg);
            // peer1.setRemoteDescription(new RTCSessionDescription(msg));
            break;
          case 'text':
            //var tx = $("textarea").val();
            var incomeTs = msg['msg'] ? msg['msg']['text'] : "";
            var newTx = that.msg + incomeTs;
            //$("textarea").val(newTx);
            that.msg = newTx;
            break;
        }
      },
      onAddIceCandidateSuccess(pc) {
        console.log('addIceCandidate success');
      },
      onAddIceCandidateError(pc, error) {
        console.log('failed to add ICE Candidate: ' + error.toString());
      },
      onStart() {
        console.log('Requesting local stream');
        this.disstart = true;
        var constraints = {
          audio: true,
          video: false
        };
        var peer1Audio = document.getElementById('peer1Audio');
        let that = this;
        AdapterJS.webRTCReady(function (isUsingPlugin) {
          getUserMedia(constraints, function (stream) {
            const audioTracks = stream.getAudioTracks();
            console.log('Got stream with constraints:', constraints);
            console.log('Using audio device: ' + audioTracks[0].label);
            stream.oninactive = function () {
              console.log('Stream ended');
            };
            stream.onended = function () {
              console.log('stream.onended');
            };
            window.stream = stream; // make variable available to browser console

            peer1Audio = attachMediaStream(peer1Audio, stream);
            that.localStream = stream;
            //console.log(discall);
            that.discall = false;
            if (that.ishangup) {
              that.ishangup = false;
              that.onCall();
            }


          }, function (error) {
            console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
          });
        });
      },
      onCall() {
        let that = this;
        if (this.ishangup) {
          this.onStart();
        }
        this.discall = true;
        this.dishang = false;
        console.log('Starting call');
        var startTime = window.performance.now();
        console.log(startTime)
        var audioTracks = this.localStream.getAudioTracks();
        console.log(audioTracks.length)
        if (audioTracks.length > 0) {
          console.log('Using audio device: ' + audioTracks[0].label);
        }
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
              "username": "jetty"
            }
          ],
          "blockStatus": "NOT_BLOCKED",
          "iceTransportPolicy": "all"
        };
        var offerOptions = {
          offerToReceiveAudio: 1,
          voiceActivityDetection: false
        };
        this.peer1 = new RTCPeerConnection(servers);
        console.log('Created peer connection object peer7');
        this.peer1.onicecandidate = function (e) {
          that.onIceCandidate(e);
        };
        this.peer1.oniceconnectionstatechange = function (e) {
          that.onIceStateChange(e);
        };

        this.peer1.addStream(this.localStream);
        console.log('Added local stream to peer1');

        console.log('peer1 createOffer start');
        this.peer1.createOffer(that.onCreateOfferSuccess, that.onCreateSessionDescriptionError,
          offerOptions);
      },
      // onCreateOfferSuccess(desc) {
      //   console.log('Offer from peer1\n' + desc.sdp);
      //   console.log('peer1 setLocalDescription start');
      //
      //   desc.sdp = this.forceChosenAudioCodec(desc.sdp);
      //   this.peer1.setLocalDescription(desc, function () {
      //     onSetLocalSuccess();
      //     sendMessage(desc);
      //   }, onSetSessionDescriptionError);
      // },
      onCreateSessionDescriptionError(error) {
        console.log('Failed to create session description: ' + error.toString());
      },
      forceChosenAudioCodec(sdp) {
        return this.maybePreferCodec(sdp, 'audio', 'send', 'opus');
      },
      onCreateOfferSuccess(desc) {
        let that = this;
        console.log('Offer from peer1\n' + desc.sdp);
        console.log('peer1 setLocalDescription start');
        desc.sdp = this.forceChosenAudioCodec(desc.sdp);
        this.peer1.setLocalDescription(desc, function () {
          that.onSetLocalSuccess();
          that.sendMessage(desc);
        }, that.onSetSessionDescriptionError);
      },
      onSetLocalSuccess() {
        console.log('setLocalDescription complete');
      },
      onSetSessionDescriptionError(error) {
        console.log('Failed to set session description: ' + error.toString());
      },
      onIceCandidate(event) {
        console.log(event)
        if (event.candidate) {
          this.sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
          });
        } else {
          console.log("End of candidates.");
        }
      },
      onIceStateChange(event) {
        console.log(this.peer1);
        console.log('ICE state: ' + this.peer1.iceConnectionState);
        console.log('ICE state change event: ', event);
      },

      forceChosenAudioCodec(sdp) {
        return this.maybePreferCodec(sdp, 'audio', 'send', 'opus');
      },

      // Copied from AppRTC's sdputils.js:

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
      findLine(sdpLines, prefix, substr) {
        return this.findLineInRange(sdpLines, 0, -1, prefix, substr);
      },
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
      sendMessage(message) {
        var msg = {};
        msg.user = this.name;
        msg.type = message.type;
        msg.message = message;
        var msgString = JSON.stringify(msg);
        this.wss.send(msgString);
      },
      onHang() {
        console.log('Ending call');
        this.peer1.close();
        this.peer1 = null;
        this.dishang = true;
        this.discall = false
        var message = {
          "type": "hangup"
        };
        this.sendMessage(message);
        this.ishangup = true
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .myaudio {
    width: 60%;
    text-align: left;
  }

  .mytext {
    width: 60%;
    height: 400px;
  }

  .mytextarea {
    width: 100%;
  }

  .mybutton {
    text-align: left;
  }
</style>
