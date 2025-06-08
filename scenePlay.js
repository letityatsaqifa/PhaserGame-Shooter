var scenePlay = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function () {
        Phaser.Scene.call(this, { key: "scenePlay" });
    },
    init: function () {
        // Reset gameover flag and score
        this.gameover = false;
        this.scoreValue = 0;
        this.scoreAtLastBossDefeat = 0; // Untuk melacak skor kapan bos terakhir dikalahkan
        this.nextBossScoreThreshold = 30; // Skor minimal untuk bos pertama muncul / skor tambahan untuk bos berikutnya

        // Boss related variables
        this.boss = null;
        this.bossHealth = 30; // Darah bos
        this.bossActive = false;
        this.bossAttackTimer = null;
        this.arrBossBullets = []; // Array untuk menyimpan peluru bos
        this.bossSpawned = false; // Flag untuk memastikan bos hanya muncul sekali per siklus
        this.bossMoveTween = null; // Untuk tween pergerakan bos

        // Sequential boss bullet variables
        this.bossBulletSequenceCount = 0; // Jumlah peluru dalam satu urutan tembakan
        this.bossTotalBulletsInSequence = 5; // Total peluru yang akan ditembakkan berurutan
        this.bossBulletDelayTimer = null; // Timer untuk jeda antar peluru bos
        this.timeBetweenBossBullets = 200; // Jeda dalam ms antar peluru bos dalam satu sequence
    },
    preload: function () {
        this.load.image('BG1', 'assets/images/BG1.png');
        this.load.image('BG2', 'assets/images/BG2.png');
        this.load.image('BG3', 'assets/images/BG3.png');
        this.load.image('GroundTransisi', 'assets/images/Transisi.png');
        this.load.image('Pesawat1', 'assets/images/Pesawat1.png');
        this.load.image('Pesawat2', 'assets/images/Pesawat2.png');
        this.load.image('Peluru', 'assets/images/Peluru.png');
        this.load.image('EfekLedakan', 'assets/images/EfekLedakan.png');
        this.load.image('Cloud', 'assets/images/Cloud.png');
        this.load.image('Musuh1', 'assets/images/Musuh1.png');
        this.load.image('Musuh2', 'assets/images/Musuh2.png');
        this.load.image('Musuh3', 'assets/images/Musuh3.png');
        this.load.image('MusuhBos', 'assets/images/MusuhBos.png');
        this.load.audio('snd_shoot', 'assets/audio/fx_shoot.mp3');
        this.load.audio('snd_explode', 'assets/audio/fx_explode.mp3');
        this.load.audio('music_play', 'assets/audio/music_play.mp3');
        this.load.audio('fx_fail', 'assets/audio/fx_fail.mp3');
    },
    create: function () {
        if (this.music_play == null) {
            this.music_play = this.sound.add('music_play', { loop: true });
        }

        let musicState = parseInt(localStorage.getItem('music_enabled') || 1);

        if (musicState == 1) {
            if (!this.music_play.isPlaying) {
                this.music_play.play();
            }
        } else {
            this.music_play.stop();
        }

        this.events.on('shutdown', function () {
            if (this.music_play && this.music_play.isPlaying) {
                this.music_play.stop();
            }
            if (this.bossAttackTimer) {
                this.bossAttackTimer.destroy();
            }
            if (this.bossBulletDelayTimer) { // Hentikan timer peluru berurutan
                this.bossBulletDelayTimer.destroy();
            }
            if (this.regularEnemyTimer) {
                this.regularEnemyTimer.destroy();
            }
            if (this.bossMoveTween) {
                this.bossMoveTween.stop();
                this.bossMoveTween = null;
            }
        }, this);

        this.lastBgIndex = Phaser.Math.Between(1, 3);
        this.bgBottomSize = { 'width': 768, 'height': 1664 };
        this.arrBgBottom = [];
        this.createBGBottom = function (xPos, yPos) {
            let bgBottom = this.add.image(xPos, yPos, 'BG' + this.lastBgIndex);
            bgBottom.setData('kecepatan', 3);
            bgBottom.setDepth(1);
            bgBottom.flipX = Phaser.Math.Between(0, 1);
            this.arrBgBottom.push(bgBottom);
            let newBgIndex = Phaser.Math.Between(1, 3);
            if (newBgIndex != this.lastBgIndex) {
                let bgBottomAddition = this.add.image(xPos, yPos - this.bgBottomSize.height / 2, 'GroundTransisi');
                bgBottomAddition.setData('kecepatan', 3);
                bgBottomAddition.setData('tambahan', true);
                bgBottomAddition.setDepth(2);
                bgBottomAddition.flipX = Phaser.Math.Between(0, 1);
                this.arrBgBottom.push(bgBottomAddition);
            }
            this.lastBgIndex = newBgIndex;
        };
        this.addBGBottom = function () {
            if (this.arrBgBottom.length > 0) {
                let lastBg = this.arrBgBottom[this.arrBgBottom.length - 1];
                if (lastBg.getData('tambahan')) {
                    lastBg = this.arrBgBottom[this.arrBgBottom.length - 2];
                }
                this.createBGBottom(game.canvas.width / 2, lastBg.y - this.bgBottomSize.height);
            } else {
                this.createBGBottom(game.canvas.width / 2, game.canvas.height - this.bgBottomSize.height / 2);
            }
        };
        this.addBGBottom();
        this.addBGBottom();
        this.addBGBottom();

        this.bgCloudSize = { 'width': 768, 'height': 1962 };
        this.arrBgTop = [];
        this.createBGTop = function (xPos, yPos) {
            var bgTop = this.add.image(xPos, yPos, 'Cloud');
            bgTop.setData('kecepatan', 6);
            bgTop.setDepth(5);
            bgTop.flipX = Phaser.Math.Between(0, 1);
            bgTop.setAlpha(Phaser.Math.Between(4, 7) / 10);
            this.arrBgTop.push(bgTop);
        };
        this.addBGTop = function () {
            if (this.arrBgTop.length > 0) {
                let lastBg = this.arrBgTop[this.arrBgTop.length - 1];
                this.createBGTop(game.canvas.width / 2, lastBg.y - this.bgCloudSize.height * Phaser.Math.Between(1, 4));
            } else {
                this.createBGTop(game.canvas.width / 2, -this.bgCloudSize.height);
            }
        };
        this.addBGTop();

        var X_POSITION = {
            'LEFT': 0,
            'CENTER': game.canvas.width / 2,
            'RIGHT': game.canvas.width
        };

        var Y_POSITION = {
            'TOP': 0,
            'CENTER': game.canvas.height / 2,
            'BOTTOM': game.canvas.height
        };

        this.scoreLabel = this.add.text(X_POSITION.CENTER, Y_POSITION.TOP + 80, '0', {
            fontFamily: 'Verdana, Arial',
            fontSize: '70px',
            color: '#ffffff',
            stroke: '#5c5c5c',
            strokeThickness: 8,
        });
        this.scoreLabel.setOrigin(0.5);
        this.scoreLabel.setDepth(100);

        this.heroShip = this.add.image(X_POSITION.CENTER, Y_POSITION.BOTTOM - 200, 'Pesawat' + (currentHero + 1));
        this.heroShip.setDepth(4);
        this.heroShip.setScale(0.35);

        this.cursorKeyListener = this.input.keyboard.createCursorKeys();

        this.input.on('pointermove', function (pointer, currentlyOver) {
            if (!this.heroShip.active || this.gameover) return;
            let movementX = this.heroShip.x;
            let movementY = this.heroShip.y;
            if (pointer.x > 70 && pointer.x < (X_POSITION.RIGHT - 70)) {
                movementX = pointer.x;
            } else {
                if (pointer.x <= 70) {
                    movementX = 70;
                } else {
                    movementX = (X_POSITION.RIGHT - 70);
                }
            }

            if (pointer.y > 70 && pointer.y < (Y_POSITION.BOTTOM - 70)) {
                movementY = pointer.y;
            } else {
                if (pointer.y <= 70) {
                    movementY = 70;
                } else {
                    movementY = (Y_POSITION.BOTTOM - 70);
                }
            }
            let a = movementX - this.heroShip.x;
            let b = movementY - this.heroShip.y;
            let durationToMove = Math.sqrt(a * a + b * b) * 0.4;
            this.tweens.add({
                targets: this.heroShip,
                x: movementX,
                y: movementY,
                duration: durationToMove > 0 ? durationToMove : 50,
            });
        }, this);

        let pointA = [];
        pointA.push(new Phaser.Math.Vector2(-200, 100));
        pointA.push(new Phaser.Math.Vector2(250, 200));
        pointA.push(new Phaser.Math.Vector2(200, (Y_POSITION.BOTTOM + 200) / 2));
        pointA.push(new Phaser.Math.Vector2(200, Y_POSITION.BOTTOM + 200));

        let pointB = [];
        pointB.push(new Phaser.Math.Vector2(900, 100));
        pointB.push(new Phaser.Math.Vector2(550, 200));
        pointB.push(new Phaser.Math.Vector2(500, (Y_POSITION.BOTTOM + 200) / 2));
        pointB.push(new Phaser.Math.Vector2(500, Y_POSITION.BOTTOM + 200));

        let pointC = [];
        pointC.push(new Phaser.Math.Vector2(900, 100));
        pointC.push(new Phaser.Math.Vector2(550, 200));
        pointC.push(new Phaser.Math.Vector2(400, (Y_POSITION.BOTTOM + 200) / 2));
        pointC.push(new Phaser.Math.Vector2(0, Y_POSITION.BOTTOM + 200));

        let pointD = [];
        pointD.push(new Phaser.Math.Vector2(-200, 100));
        pointD.push(new Phaser.Math.Vector2(550, 200));
        pointD.push(new Phaser.Math.Vector2(650, (Y_POSITION.BOTTOM + 200) / 2));
        pointD.push(new Phaser.Math.Vector2(0, Y_POSITION.BOTTOM + 200));

        var points = [];
        points.push(pointA);
        points.push(pointB);
        points.push(pointC);
        points.push(pointD);
        this.enemyPaths = points;

        this.arrEnemy = [];

        this.EnemyClass = new Phaser.Class({
            Extends: Phaser.GameObjects.Image,
            initialize:
                function Enemy(scene, idxPath) {
                    Phaser.GameObjects.Image.call(this, scene);
                    this.setTexture('Musuh' + Phaser.Math.Between(1, 3));
                    this.setDepth(4);
                    this.setScale(0.35);
                    this.curve = new Phaser.Curves.Spline(scene.enemyPaths[idxPath]);
                    let lastEnemyCreated = this;
                    this.path = { t: 0, vec: new Phaser.Math.Vector2() };
                    scene.tweens.add({
                        targets: this.path,
                        t: 1,
                        duration: 3000,
                        onComplete: function () {
                            if (lastEnemyCreated) {
                                lastEnemyCreated.setActive(false);
                            }
                        }
                    });
                },
            move: function () {
                if (this.curve) {
                    this.curve.getPoint(this.path.t, this.path.vec);
                    this.x = this.path.vec.x;
                    this.y = this.path.vec.y;
                }
            }
        });

        this.regularEnemyTimer = this.time.addEvent({
            delay: 250, callback: function () {
                if (this.gameover || this.bossActive) return; // Jangan spawn musuh biasa jika bos aktif
                if (this.arrEnemy.length < 3) {
                    this.arrEnemy.push(this.children.add(new this.EnemyClass(this, Phaser.Math.Between(0, this.enemyPaths.length - 1))));
                }
            }, callbackScope: this, loop: true
        });

        this.PlayerBulletClass = new Phaser.Class({
            Extends: Phaser.GameObjects.Image,
            initialize:
                function Bullets(scene, x, y) {
                    Phaser.GameObjects.Image.call(this, scene, x, y, 'Peluru');
                    this.setDepth(3);
                    this.setScale(0.5);
                    this.speed = 20;
                },
            move: function () {
                this.y -= this.speed;
                if (this.y < -50) {
                    this.setActive(false);
                }
            }
        });
        this.arrBullets = [];

        this.BossBulletClass = new Phaser.Class({
            Extends: Phaser.GameObjects.Image,
            initialize: function BossBullet(scene, x, y) { // Angle tidak lagi diperlukan di sini untuk gerakan lurus
                Phaser.GameObjects.Image.call(this, scene, x, y, 'Peluru'); // Bisa ganti sprite peluru bos jika ada
                this.setDepth(3);
                this.setScale(0.7); // Ukuran peluru bos bisa disesuaikan
                this.speed = 6; // Kecepatan peluru bos
                this.setTint(0xff0000); // Beri warna merah pada peluru bos (opsional)
            },
            move: function () {
                this.y += this.speed; // Peluru bos bergerak ke bawah
                if (this.y > game.canvas.height + 50 || this.x < -50 || this.x > game.canvas.width + 50) {
                    this.setActive(false);
                }
            }
        });


        this.input.keyboard.on('keydown-SPACE', function (event) {
            if (!this.heroShip.active || this.gameover) return;
            this.arrBullets.push(this.children.add(new this.PlayerBulletClass(this, this.heroShip.x, this.heroShip.y - 30)));
            let soundState = parseInt(localStorage.getItem('sound_enabled') || 1);
            if (soundState == 1) {
                this.snd_shoot.play();
            }
        }, this);

        this.snd_shoot = this.sound.add('snd_shoot');
        this.snd_explode = this.sound.add('snd_explode');
        this.fx_fail = this.sound.add('fx_fail');
    },

    spawnBoss: function () {
        if (this.bossSpawned || this.gameover) return; // Pastikan bos tidak spawn jika sudah ada atau gameover
        this.bossSpawned = true; // Tandai bos sudah mau spawn/proses spawn
        this.bossActive = true;  // Bos menjadi aktif

        if (this.regularEnemyTimer) this.regularEnemyTimer.paused = true; // Hentikan spawn musuh biasa
        // Hancurkan semua musuh biasa yang ada di layar
        for (let i = this.arrEnemy.length - 1; i >= 0; i--) {
            if (this.arrEnemy[i]) {
                this.arrEnemy[i].destroy();
            }
        }
        this.arrEnemy = [];

        this.boss = this.add.image(game.canvas.width / 2, -150, 'MusuhBos');
        this.boss.setDepth(5);
        this.boss.setScale(0.7);
        this.boss.active = true; // Properti active dari GameObject
        this.bossHealth = 30; // Reset darah bos setiap kali spawn

        this.tweens.add({
            targets: this.boss,
            y: 150,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                if (this.gameover || !this.boss || !this.boss.active) return;
                // Mulai timer utama serangan bos (yang akan memicu sequence)
                if (this.bossAttackTimer) this.bossAttackTimer.destroy(); // Hapus timer lama jika ada
                this.bossAttackTimer = this.time.addEvent({
                    delay: 2500, // Jeda antar sequence tembakan bos
                    callback: this.initiateBossShootSequence, // Fungsi untuk memulai urutan tembakan
                    callbackScope: this,
                    loop: true
                });
                this.startBossMovement();
            }
        });
    },

    startBossMovement: function () {
        if (!this.boss || !this.boss.active || this.gameover) return;
        const screenWidth = game.canvas.width;
        const bossWidth = this.boss.displayWidth;
        const minX = bossWidth / 2 + 50;
        const maxX = screenWidth - (bossWidth / 2) - 50;

        if (this.bossMoveTween) {
            this.bossMoveTween.stop();
            this.bossMoveTween.destroy(); // Pastikan tween lama dihancurkan
        }
        
        let targetX = (this.boss.x < screenWidth / 2) ? maxX : minX;

        this.bossMoveTween = this.tweens.add({
            targets: this.boss,
            x: targetX,
            duration: Phaser.Math.Between(3000, 5000),
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            onYoyo: () => {
                if (this.boss && this.boss.active && this.bossMoveTween) {
                    this.bossMoveTween.updateTo('x', (this.boss.x < screenWidth / 2) ? maxX : minX, true);
                    this.bossMoveTween.updateTo('duration', Phaser.Math.Between(3000, 5000), true);
                } else if (this.bossMoveTween) {
                    this.bossMoveTween.stop();
                }
            },
            onRepeat: () => {
                if (this.boss && this.boss.active && this.bossMoveTween) {
                    this.bossMoveTween.updateTo('x', (this.boss.x < screenWidth / 2) ? maxX : minX, true);
                    this.bossMoveTween.updateTo('duration', Phaser.Math.Between(3000, 5000), true);
                } else if (this.bossMoveTween) {
                    this.bossMoveTween.stop();
                }
            }
        });
    },

    initiateBossShootSequence: function() {
        if (!this.boss || !this.boss.active || !this.bossActive || this.gameover) {
            if (this.bossAttackTimer) this.bossAttackTimer.paused = true;
            if (this.bossBulletDelayTimer) this.bossBulletDelayTimer.destroy();
            return;
        }
        this.bossBulletSequenceCount = 0; // Reset hitungan peluru dalam sequence
        
        // Hapus timer lama jika masih ada untuk menghindari tumpukan
        if (this.bossBulletDelayTimer) {
            this.bossBulletDelayTimer.remove(false); // false agar tidak menjalankan callback saat dihapus
            this.bossBulletDelayTimer.destroy();
        }

        this.bossBulletDelayTimer = this.time.addEvent({
            delay: this.timeBetweenBossBullets, // Jeda antar peluru
            callback: this.fireSingleBossBullet,
            callbackScope: this,
            repeat: this.bossTotalBulletsInSequence -1 // Ulangi N-1 kali (karena yang pertama langsung jalan)
        });
        this.fireSingleBossBullet(); // Tembak peluru pertama segera
    },

    fireSingleBossBullet: function() {
        if (!this.boss || !this.boss.active || !this.bossActive || this.gameover || this.bossBulletSequenceCount >= this.bossTotalBulletsInSequence) {
             if (this.bossBulletDelayTimer) { // Hentikan jika kondisi tidak terpenuhi
                this.bossBulletDelayTimer.destroy();
                this.bossBulletDelayTimer = null;
            }
            return;
        }

        if (this.BossBulletClass) {
            // Tembak satu peluru dari tengah bos
            let bulletX = this.boss.x;
            let bulletY = this.boss.y + this.boss.displayHeight / 2;
            
            let bossBullet = this.children.add(new this.BossBulletClass(this, bulletX, bulletY));
            this.arrBossBullets.push(bossBullet);
        }
        this.bossBulletSequenceCount++;

        let soundState = parseInt(localStorage.getItem('sound_enabled') || 1);
        if (soundState == 1) {
            this.snd_shoot.play({ volume: 0.5, detune: Phaser.Math.Between(-400, -200) }); // Suara sedikit beda
        }
    },

    // Fungsi bossShoot yang lama tidak lagi digunakan, digantikan initiateBossShootSequence dan fireSingleBossBullet
    // bossShoot: function () { ... } // HAPUS ATAU KOMENTARI FUNGSI INI

    playerDies: function () {
        if (this.gameover) return;

        this.gameover = true; // Game berakhir HANYA jika pemain mati
        if (this.bossAttackTimer) this.bossAttackTimer.destroy();
        if (this.bossBulletDelayTimer) this.bossBulletDelayTimer.destroy(); // Hentikan juga timer ini
        if (this.regularEnemyTimer) this.regularEnemyTimer.destroy();
        if (this.bossMoveTween) {
            this.bossMoveTween.stop();
            this.bossMoveTween = null;
        }

        if (this.heroShip.active) {
            this.createExplosionEffect(this.heroShip.x, this.heroShip.y, 0.8, 1000, 5);
            this.heroShip.destroy();
        }

        let soundState = parseInt(localStorage.getItem('sound_enabled') || 1);
        if (soundState == 1) {
            this.fx_fail.play();
        }

        let currentHighScore = parseInt(localStorage.getItem('highScore_PlaneGame') || 0);
        if (this.scoreValue > currentHighScore) {
            localStorage.setItem('highScore_PlaneGame', this.scoreValue);
        }

        this.time.delayedCall(1500, () => {
            if (this.scene.isActive(this.key)) {
                this.scene.start('sceneGameOver', { score: this.scoreValue });
            }
        }, [], this);
    },

    createExplosionEffect: function (x, y, scale = 0.6, duration = 500, count = 3) {
        let offsets = [];
        const baseOffsetRange = 50;
        const baseDistanceCheck = 20;

        for (let i = 0; i < count; i++) {
            let offsetX, offsetY, tooClose;
            let attempts = 0;
            do {
                offsetX = Phaser.Math.Between(-baseOffsetRange, baseOffsetRange) * (scale / 0.6);
                offsetY = Phaser.Math.Between(-baseOffsetRange, baseOffsetRange) * (scale / 0.6);
                tooClose = offsets.some(existing => {
                    return Phaser.Math.Distance.Between(existing.x, existing.y, offsetX, offsetY) < baseDistanceCheck * (scale / 0.6);
                });
                attempts++;
            } while (tooClose && attempts < 10);
            offsets.push({ x: offsetX, y: offsetY });
        }

        for (let k = 0; k < offsets.length; k++) {
            if (!this.scene.isActive(this.key)) return;
            let ledakan = this.add.sprite(x + offsets[k].x, y + offsets[k].y, 'EfekLedakan');
            ledakan.setAlpha(0.7);
            ledakan.setDepth(10);
            ledakan.setScale(0.1 * scale);
            this.tweens.add({
                targets: ledakan,
                x: ledakan.x + Phaser.Math.Between(-20, 20) * (scale / 0.6),
                y: ledakan.y + Phaser.Math.Between(-20, 20) * (scale / 0.6),
                scaleX: scale,
                scaleY: scale,
                alpha: 0,
                ease: 'Cubic.easeOut',
                duration: duration,
                onComplete: () => {
                    ledakan.destroy();
                }
            });
        }
    },

    update: function () {
        if (this.gameover) {
            return;
        }
        // Background scrolling
        for (let i = this.arrBgBottom.length - 1; i >= 0; i--) {
            if (this.arrBgBottom[i] && this.arrBgBottom[i].active) {
                this.arrBgBottom[i].y += this.arrBgBottom[i].getData('kecepatan');
                if (this.arrBgBottom[i].y >= game.canvas.height + this.bgBottomSize.height / 2) {
                    this.arrBgBottom[i].destroy();
                    this.arrBgBottom.splice(i, 1);
                    this.addBGBottom();
                }
            } else if (this.arrBgBottom[i]) {
                this.arrBgBottom[i].destroy();
                this.arrBgBottom.splice(i, 1);
            } else {
                this.arrBgBottom.splice(i, 1);
            }
        }
        for (let i = this.arrBgTop.length - 1; i >= 0; i--) {
            if (this.arrBgTop[i] && this.arrBgTop[i].active) {
                this.arrBgTop[i].y += this.arrBgTop[i].getData('kecepatan');
                if (this.arrBgTop[i].y >= game.canvas.height + this.bgCloudSize.height / 2) {
                    this.arrBgTop[i].destroy();
                    this.arrBgTop.splice(i, 1);
                    this.addBGTop();
                }
            } else if (this.arrBgTop[i]) {
                this.arrBgTop[i].destroy();
                this.arrBgTop.splice(i, 1);
            } else {
                this.arrBgTop.splice(i, 1);
            }
        }

        // Hero movement
        if (this.heroShip.active) {
            if (this.cursorKeyListener.left.isDown && this.heroShip.x > 70) {
                this.heroShip.x -= 7;
            }
            if (this.cursorKeyListener.right.isDown && this.heroShip.x < (game.canvas.width - 70)) {
                this.heroShip.x += 7;
            }
            if (this.cursorKeyListener.up.isDown && this.heroShip.y > 70) {
                this.heroShip.y -= 7;
            }
            if (this.cursorKeyListener.down.isDown && this.heroShip.y < (game.canvas.height - 70)) {
                this.heroShip.y += 7;
            }
        }

        // --- BOSS SPAWN LOGIC ---
        // Cek apakah skor sudah mencapai threshold untuk memunculkan bos berikutnya
        // dan bos belum aktif serta belum dalam proses spawn
        if (this.scoreValue >= this.nextBossScoreThreshold && !this.bossActive && !this.bossSpawned) {
            this.spawnBoss();
        }

        // Enemy movement (jika bos tidak aktif)
        if (!this.bossActive) {
            for (let i = this.arrEnemy.length - 1; i >= 0; i--) {
                if (this.arrEnemy[i] && this.arrEnemy[i].active) {
                    this.arrEnemy[i].move();
                } else if (this.arrEnemy[i]) {
                    this.arrEnemy[i].destroy();
                    this.arrEnemy.splice(i, 1);
                } else {
                    this.arrEnemy.splice(i, 1);
                }
            }
        }

        // Player bullet movement
        for (let i = this.arrBullets.length - 1; i >= 0; i--) {
            if (this.arrBullets[i] && this.arrBullets[i].active) {
                this.arrBullets[i].move();
            } else if (this.arrBullets[i]) {
                this.arrBullets[i].destroy();
                this.arrBullets.splice(i, 1);
            } else {
                this.arrBullets.splice(i, 1);
            }
        }

        // Boss bullet movement
        if (this.bossActive) { // Hanya proses peluru bos jika bos aktif
            for (let i = this.arrBossBullets.length - 1; i >= 0; i--) {
                if (this.arrBossBullets[i] && this.arrBossBullets[i].active) {
                    this.arrBossBullets[i].move();
                } else if (this.arrBossBullets[i]) {
                    this.arrBossBullets[i].destroy();
                    this.arrBossBullets.splice(i, 1);
                } else {
                    this.arrBossBullets.splice(i, 1);
                }
            }
        }


        // --- COLLISION DETECTION ---
        for (let j = this.arrBullets.length - 1; j >= 0; j--) {
            if (!this.arrBullets[j] || !this.arrBullets[j].active) continue;

            // Collision: Player Bullet vs Regular Enemy (hanya jika bos tidak aktif)
            if (!this.bossActive) {
                for (let i = this.arrEnemy.length - 1; i >= 0; i--) {
                    if (!this.arrEnemy[i] || !this.arrEnemy[i].active) continue;
                    if (Phaser.Geom.Intersects.RectangleToRectangle(this.arrBullets[j].getBounds(), this.arrEnemy[i].getBounds())) {
                        this.arrEnemy[i].setActive(false); // Hancurkan musuh
                        this.arrBullets[j].setActive(false); // Hancurkan peluru
                        this.scoreValue++;
                        this.scoreLabel.setText(this.scoreValue);
                        let soundState = parseInt(localStorage.getItem('sound_enabled') || 1);
                        if (soundState == 1) this.snd_explode.play();
                        this.createExplosionEffect(this.arrBullets[j].x, this.arrBullets[j].y);
                        break; // Peluru hanya bisa kena satu musuh
                    }
                }
            }
            // Collision: Player Bullet vs Boss
            else if (this.boss && this.boss.active) { // Cek this.boss ada dan aktif
                if (Phaser.Geom.Intersects.RectangleToRectangle(this.arrBullets[j].getBounds(), this.boss.getBounds())) {
                    this.arrBullets[j].setActive(false); // Hancurkan peluru
                    this.bossHealth--;
                    this.createExplosionEffect(this.arrBullets[j].x, this.boss.y + Phaser.Math.Between(-20, 20), 0.4, 300, 1);
                    let soundState = parseInt(localStorage.getItem('sound_enabled') || 1);
                    if (soundState == 1) this.snd_explode.play({ detune: -100, volume: 0.8 });

                    if (this.bossHealth <= 0) {
                        // --- BOSS DEFEATED ---
                        this.scoreValue += 20; // Tambah skor 20 untuk bos
                        this.scoreLabel.setText(this.scoreValue);
                        this.scoreAtLastBossDefeat = this.scoreValue; // Simpan skor saat ini
                        this.nextBossScoreThreshold = this.scoreAtLastBossDefeat + 30; // Tentukan skor untuk bos berikutnya

                        this.createExplosionEffect(this.boss.x, this.boss.y, 1.5, 2000, 7);
                        
                        // Hentikan semua yang berhubungan dengan bos saat ini
                        if (this.bossAttackTimer) this.bossAttackTimer.destroy();
                        if (this.bossBulletDelayTimer) this.bossBulletDelayTimer.destroy();
                        if (this.bossMoveTween) {
                            this.bossMoveTween.stop();
                            this.bossMoveTween = null; // Hancurkan tween
                        }
                        if (this.boss) this.boss.destroy(); // Hancurkan game object bos
                        this.boss = null; // Set null agar tidak diakses lagi

                        this.bossActive = false;  // Bos tidak lagi aktif
                        this.bossSpawned = false; // Bos sudah dikalahkan, bisa spawn lagi nanti

                        // Lanjutkan spawn musuh biasa
                        if (this.regularEnemyTimer) this.regularEnemyTimer.paused = false;
                        
                        // Bersihkan sisa peluru bos di layar
                        for (let k = this.arrBossBullets.length - 1; k >= 0; k--) {
                            if (this.arrBossBullets[k]) {
                                this.arrBossBullets[k].destroy();
                            }
                        }
                        this.arrBossBullets = [];

                        // Game berlanjut...
                        return; // Keluar dari loop collision untuk frame ini karena bos baru saja dikalahkan
                    }
                    break; // Peluru hanya bisa kena bos sekali
                }
            }
        }
        if (this.gameover) return; // Cek lagi jika playerDies dipanggil dari collision lain

        // Collision: Hero vs Regular Enemy (hanya jika bos tidak aktif)
        if (this.heroShip.active && !this.bossActive) {
            for (let i = this.arrEnemy.length - 1; i >= 0; i--) {
                if (!this.arrEnemy[i] || !this.arrEnemy[i].active) continue;
                if (Phaser.Geom.Intersects.RectangleToRectangle(this.heroShip.getBounds(), this.arrEnemy[i].getBounds())) {
                    this.playerDies();
                    return; // Game over
                }
            }
        }

        // Collision: Hero vs Boss Bullet
        if (this.heroShip.active && this.bossActive && this.arrBossBullets.length > 0) {
            for (let i = this.arrBossBullets.length - 1; i >= 0; i--) {
                if (!this.arrBossBullets[i] || !this.arrBossBullets[i].active) continue;
                if (Phaser.Geom.Intersects.RectangleToRectangle(this.heroShip.getBounds(), this.arrBossBullets[i].getBounds())) {
                    this.arrBossBullets[i].setActive(false); // Hancurkan peluru bos
                    this.playerDies();
                    return; // Game over
                }
            }
        }
        
        // Collision: Hero vs Boss Body
        if (this.heroShip.active && this.bossActive && this.boss && this.boss.active) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.heroShip.getBounds(), this.boss.getBounds())) {
                this.playerDies();
                return; // Game over
            }
        }
    },
});