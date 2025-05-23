import {getSeekingByteFromIsoBaseMedia} from './containers/iso-base-media/get-seeking-byte';
import {getSeekingByteFromWav} from './containers/wav/get-seeking-byte';
import {getSeekingByteFromMatroska} from './containers/webm/seek/get-seeking-byte';
import type {LogLevel} from './log';
import type {SeekingHints} from './seeking-hints';
import type {IsoBaseMediaState} from './state/iso-base-media/iso-state';
import type {WebmState} from './state/matroska/webm';
import {getLastKeyFrameBeforeTimeInSeconds} from './state/transport-stream/observed-pes-header';
import type {TransportStreamState} from './state/transport-stream/transport-stream';
import type {MediaSectionState} from './state/video-section';
import type {SeekResolution} from './work-on-seek-request';

export const getSeekingByte = ({
	info,
	time,
	logLevel,
	currentPosition,
	isoState,
	transportStream,
	webmState,
	mediaSection,
}: {
	info: SeekingHints;
	time: number;
	logLevel: LogLevel;
	currentPosition: number;
	isoState: IsoBaseMediaState;
	transportStream: TransportStreamState;
	webmState: WebmState;
	mediaSection: MediaSectionState;
}): Promise<SeekResolution> => {
	if (info.type === 'iso-base-media-seeking-hints') {
		return getSeekingByteFromIsoBaseMedia({
			info,
			time,
			logLevel,
			currentPosition,
			isoState,
		});
	}

	if (info.type === 'wav-seeking-hints') {
		return getSeekingByteFromWav({
			info,
			time,
		});
	}

	if (info.type === 'webm-seeking-hints') {
		return getSeekingByteFromMatroska({
			info,
			time,
			webmState,
			logLevel,
			mediaSection,
		});
	}

	if (info.type === 'transport-stream-seeking-hints') {
		const lastKeyframeBeforeTimeInSeconds = getLastKeyFrameBeforeTimeInSeconds({
			observedPesHeaders: info.observedPesHeaders,
			timeInSeconds: time,
			ptsStartOffset: info.ptsStartOffset,
		});

		const byte = lastKeyframeBeforeTimeInSeconds?.offset ?? 0;

		transportStream.resetBeforeSeek();
		return Promise.resolve({
			type: 'do-seek',
			byte,
		});
	}

	throw new Error(`Unknown seeking info type: ${info as never}`);
};
