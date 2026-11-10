import { _decorator, AudioClip, AudioSource, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    static instance:AudioManager = null;

    private _audioSource: AudioSource;

    @property({ type: [AudioClip], tooltip: "把所有音频Prefab拖进来，代码里按文件名调用" })
    audioClips: AudioClip[] = [];

    private _map: Map<string, AudioClip> = new Map();


    onLoad(){
        AudioManager.instance = this;
        for (const p of this.audioClips) {
            this._map.set(p.name, p);
        }
        this._audioSource = this.addComponent(AudioSource);
    }

      /**
     * @en
     * play short audio, such as strikes,explosions
     * @zh
     * 播放短音频,比如 打击音效，爆炸音效等
     * @param sound clip or url for the audio
     * @param volume 
     */
    playOneShot(sound:string, volume: number = 1.0) {
        const clip = this._map.get(sound);
        if(!clip){
            console.warn(`AudioManager 找不到音效：[${sound}]`);
            return ;
        }
        this._audioSource.playOneShot(clip, volume);
    }

    /**
     * @en
     * play long audio, such as the bg music
     * @zh
     * 播放长音频，比如 背景音乐
     * @param sound clip or url for the sound
     * @param volume 
     */
    play(sound:string, volume: number = 1.0) {

        const clip = this._map.get(sound);
         if(!clip){
            console.warn(`AudioManager 找不到音效：[${sound}]`);
            return ;
        }
        this._audioSource.stop();
        this._audioSource.loop = true;
        this._audioSource.clip = clip;
        this._audioSource.play();
        this._audioSource.volume = volume;

        
    }

    /**
     * stop the audio play
     */
    stop() {
        this._audioSource.stop();
    }

    /**
     * pause the audio play
     */
    pause() {
        this._audioSource.pause();
    }

    /**
     * resume the audio play
     */
    resume(){
        this._audioSource.play();
    }
}


