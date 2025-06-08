var sceneMenu = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function () {
        Phaser.Scene.call(this, { key: "sceneMenu" });
    },
    init: function () { },
    preload: function () {
        this.load.image('BGPlay', 'assets/images/BGPlay.png');
        this.load.image('Title', 'assets/images/Title.png');
        this.load.image('ButtonPlay', 'assets/images/ButtonPlay.png');
        this.load.image('ButtonSoundOn', 'assets/images/ButtonSoundOn.png');
        this.load.image('ButtonSoundOff', 'assets/images/ButtonSoundOff.png');
        this.load.image('ButtonMusicOn', 'assets/images/ButtonMusicOn.png');
        this.load.image('ButtonMusicOff', 'assets/images/ButtonMusicOff.png');
        this.load.audio('snd_menu', 'assets/audio/music_menu.mp3');
        this.load.audio('snd_touchshooter', 'assets/audio/fx_touch.mp3');
    },
    create: function () {
        const X_POSITION = {
            'LEFT': 0,
            'CENTER': game.canvas.width / 2,
            'RIGHT': game.canvas.width,
        };
        const Y_POSITION = {
            'TOP': 0,
            'CENTER': game.canvas.height / 2,
            'BOTTOM': game.canvas.height,
        };

        // Setup musik background
        if (this.snd_menu == null) {
            this.snd_menu = this.sound.add('snd_menu', { loop: true });
        }

        // Cek status music dari localStorage
        let musicState = parseInt(localStorage.getItem('music_enabled') || 1);

        if (musicState == 1) {
            if (!this.snd_menu.isPlaying) {
                this.snd_menu.play();
            }
        } else {
            this.snd_menu.stop();
        }

        this.events.on('shutdown', function () {
            if (this.snd_menu && this.snd_menu.isPlaying) {
                this.snd_menu.stop();
            }
        }, this);

        // Tampilan UI
        this.add.image(X_POSITION.CENTER, Y_POSITION.CENTER, 'BGPlay');
        var titleGame = this.add.image(X_POSITION.CENTER, Y_POSITION.CENTER - 150, 'Title');
        var buttonPlay = this.add.image(X_POSITION.CENTER, Y_POSITION.CENTER + 150, 'ButtonPlay').setInteractive();

        // Sound setup
        var buttonSound = this.add.image(X_POSITION.RIGHT - 70, Y_POSITION.BOTTOM - 950, 'ButtonSoundOn').setInteractive();
        var buttonMusic = this.add.image(X_POSITION.RIGHT - 70, Y_POSITION.BOTTOM - 850, 'ButtonMusicOn').setInteractive(); // Sebelah kiri sound

        // Global sound effect
        if (typeof snd_touch === 'undefined' || snd_touch == null) {
            snd_touch = this.sound.add('snd_touchshooter');
        }

        // Cek setting sound & music awal
        let soundState = parseInt(localStorage.getItem('sound_enabled') || 1);
        if (soundState == 0) {
            buttonSound.setTexture('ButtonSoundOff');
            snd_touch.setVolume(0);
        } else {
            snd_touch.setVolume(1);
        }

        if (musicState == 0) {
            buttonMusic.setTexture('ButtonMusicOff');
        }

        // Event Handling
        this.input.on('gameobjectover', function (pointer, gameObject) {
            gameObject.setTint(0x999999);
        }, this);

        this.input.on('gameobjectout', function (pointer, gameObject) {
            gameObject.setTint(0xffffff);
        }, this);

        this.input.on('gameobjectup', function (pointer, gameObject) {
            if (gameObject == buttonPlay) {
                buttonPlay.setTint(0xffffff);
                snd_touch.play();
                this.scene.start('scenePilihHero');
            }
            if (gameObject == buttonSound) {
                let isSoundActive = parseInt(localStorage.getItem('sound_enabled') || 1);
                if (isSoundActive == 0) {
                    buttonSound.setTexture('ButtonSoundOn');
                    snd_touch.setVolume(1);
                    localStorage.setItem('sound_enabled', 1);
                } else {
                    buttonSound.setTexture('ButtonSoundOff');
                    snd_touch.setVolume(0);
                    localStorage.setItem('sound_enabled', 0);
                }
            }
            if (gameObject == buttonMusic) {
                let isMusicActive = parseInt(localStorage.getItem('music_enabled') || 1);
                if (isMusicActive == 0) {
                    buttonMusic.setTexture('ButtonMusicOn');
                    localStorage.setItem('music_enabled', 1);
                    if (!this.snd_menu.isPlaying) {
                        this.snd_menu.play();
                    }
                } else {
                    buttonMusic.setTexture('ButtonMusicOff');
                    localStorage.setItem('music_enabled', 0);
                    this.snd_menu.stop();
                }
            }
        }, this);

        this.input.on('gameobjectdown', function (pointer, gameObject) {
            gameObject.setTint(0x999999);
        }, this);
    },
    update: function () { },
});