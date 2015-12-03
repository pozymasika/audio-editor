import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import arrayGet from 'array-any-index';
import humanizeDuration from 'humanize-duration';
import DisplayAmplitudePath from './DisplayAmplitudePath';
import DisplayContainer from './DisplayContainer';
import PlayBar from './PlayBar';
import PlaybackRateBar from './PlaybackRateBar';
import PlaybackRateSlider from './PlaybackRateSlider';
import VolumeSlider from './VolumeSlider';
import { setPlaybackType } from '../actions/playbackType';

class AudioEditor extends Component {
  constructor(props) {
    super(props);
    this.audioPosition = 0;
    this.audioSource = null;
    this.audioProcessor = null;
  }
  componentDidMount() {
    const { audioContext } = this.props;
    this.audioPosition = 0;
    this.audioSource = audioContext.createBufferSource();
    this.audioSource.loop = true;
    this.audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    this.audioProcessor.onaudioprocess = this.onAudioProcess.bind(this);
    // connect
    this.audioSource.connect(this.audioProcessor);
    this.audioProcessor.connect(audioContext.destination);
  }
  componentWillUnmount() {
    const { dispatch, audioContext } = this.props;
    // disconnect
    this.audioProcessor.disconnect(audioContext.destination);
    this.audioSource.disconnect(this.audioProcessor);
    this.audioProcessor = null;
    this.audioSource = null;
    dispatch(setPlaybackType(0));
  }
  onAudioProcess(e) {
    const {
      buffer,
      playbackRate,
      playbackType,
      volume
    } = this.props;
    const channelData = [];
    const output = e.outputBuffer.getChannelData(0);
    if (buffer.length &&
      typeof buffer.numberOfChannels === 'number' &&
      playbackType !== 0) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        channelData[i] = buffer.getChannelData(i);
      }
    }
    for (let i = 0; i < output.length; i++) {
      output[i] = 0;
      for (let j = 0; j < channelData.length; j++) {
        // mix output
        output[i] += arrayGet(channelData[j], this.audioPosition);
      }
      // adjust output
      if (channelData.length > 1) {
        output[i] = output[i] / channelData.length;
      }
      // add volume
      output[i] = output[i] * volume;
      if (playbackType > 0) {
        this.audioPosition = this.audioPosition + playbackRate;
      } else if (playbackType < 0) {
        this.audioPosition = this.audioPosition - playbackRate;
      }
    }
  }
  render() {
    const { waveformData } = this.props;
		return (
      <div>
        <Row>
          <Col md={6}>
            <PlayBar />
          </Col>
          <Col md={6}>
            <PlaybackRateBar />
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <VolumeSlider />
          </Col>
          <Col md={6}>
            <PlaybackRateSlider />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <DisplayContainer>
              <DisplayAmplitudePath { ...waveformData } />
            </DisplayContainer>
            <div style={{textAlign: 'right'}}>
              <small>
                Render Time:
                &nbsp;
                {humanizeDuration(waveformData.renderTime)}
              </small>
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <DisplayContainer>
              <DisplayAmplitudePath />
            </DisplayContainer>
          </Col>
        </Row>
      </div>
		);
	}
}

export default connect(function (state) {
  return {
    audioContext: state.audioContext,
    buffer: state.buffer,
    playbackRate: state.playbackRate,
    playbackType: state.playbackType,
    volume: state.volume,
    waveformData: state.waveformData
  };
})(AudioEditor);
