var sceneWinner = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function() {
        Phaser.Scene.call(this, { key: 'sceneWinner' });
    },
    init: function (data) {
        // Menerima data dari scene sebelumnya
        this.score = data.score;
        this.gameConfig = data.gameConfig; //simpan data gameConfig
    },
    preload: function () {
        this.load.image('BGPlay', 'assets/images/BGPlay.png');
        this.load.image('ButtonPlay', 'assets/images/ButtonPlay.png');
        this.load.audio('snd_winner', 'assets/audio/music_winner.mp3');
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

        // Tambahkan background
        this.add.image(X_POSITION.CENTER, Y_POSITION.CENTER, 'BGPlay').setDisplaySize(X_POSITION.RIGHT, Y_POSITION.BOTTOM);

        // Tambahkan teks "Game Over"
        const winnerText = this.add.text(X_POSITION.CENTER, Y_POSITION.BOTTOM / 3.2, 'YOU WIN', {
            fontFamily: 'Arial',
            fontSize: 95,
            color: '#ff0000', // Merah
            align: 'center',
            stroke: '#ffffff',
            strokeThickness: 10
        }).setOrigin(0.5);

        // Ambil highscore dari local storage
        this.highScore = localStorage.getItem('highScore') || 0;
        this.highScore = parseInt(this.highScore); //pastikan dalam format number

        // Update highscore jika skor saat ini lebih tinggi
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }

        // Tambahkan teks "High Score"
        const highScoreText = this.add.text(X_POSITION.CENTER, Y_POSITION.BOTTOM / 2 - 55, `High Score: ${this.highScore}`, {
            fontFamily: 'Arial',
            fontSize: 45,
            color: '#948979',
            align: 'center',
            stroke: '#ffffff',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Tambahkan teks "Score"
        const scoreText = this.add.text(X_POSITION.CENTER, Y_POSITION.BOTTOM / 1.95, `Score: ${this.score}`, {
            fontFamily: 'Arial',
            fontSize: 45,
            color: '#948979',
            align: 'center',
            stroke: '#ffffff',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Tambahkan tombol "Play Again"
        const buttonPlay = this.add.image(X_POSITION.CENTER, Y_POSITION.BOTTOM * 3/4.5, 'ButtonPlay').setInteractive();

        // Tambahkan suara untuk tombol
        this.winnerMusic = this.sound.add('snd_winner');

        // Setup musik background
        if (this.snd_winner == null) {
            this.snd_winner = this.sound.add('snd_winner', { loop: true });
        }

        // Cek status music dari localStorage
        let musicState = parseInt(localStorage.getItem('music_enabled') || 1);

        if (musicState == 1) {
            if (!this.snd_winner.isPlaying) {
                this.snd_winner.play();
            }
        } else {
            this.snd_winner.stop();
        }

        this.events.on('shutdown', function () {
            if (this.snd_winner && this.snd_winner.isPlaying) {
                this.snd_winner.stop();
            }
        }, this);

        this.input.on('gameobjectup', function (pointer, gameObject) {
            if (gameObject == buttonPlay) {
                buttonPlay.setTint(0xffffff);
                snd_touch.play();
                this.scene.start('sceneMenu');
            }
        }, this);
    },
    update: function () {
    },
});