BasicGame.Level1 = function () {
};
BasicGame.Level1.prototype = {
    create: function () {
        this.stage.backgroundColor = "#FFFFFF";
        this.PLATFORM_SIZE = 500;

        // physics
        this.physics.startSystem(Phaser.Physics.ARCADE);

        // camera and platform tracking vars
        this.cameraYMin = 99999;
        this.platformYMin = 99999;

        // create platforms
        this.platformsCreate();

        // create hero
        this.heroCreate();

        // Dibujar el buscador
        var graphics = this.game.add.graphics(0, 0);
        graphics.beginFill(0xDDDDDD);
        graphics.lineStyle(3, 0xAAAAAA, 1);
        graphics.drawRect(0, 0, this.game.width, 100);
        graphics.beginFill(0xFFFFFF);
        graphics.lineStyle(1, 0xAAAAAA, 1);
        graphics.drawRect(20, 20, this.game.width - 40, 60);
        //window.graphics = graphics;
        var buscador = this.game.add.sprite(0,0);
        buscador.addChild(graphics);
        buscador.fixedToCamera = true;
        var icono = this.game.add.sprite(this.game.width - 80,20,'buscador');
        icono.scale.setTo(6,6);
        icono.fixedToCamera = true;

        // cursor controls
        this.cursor = this.input.keyboard.createCursorKeys();

        // Music
        this.music = this.add.audio('level1Music');
        if(!this.music.isPlaying)
            this.music.loopFull();
    },

    update: function () {
        // this is where the main magic happens
        // the y offset and the height of the world are adjusted
        // to match the highest point the hero has reached
        this.world.setBounds(0, -this.hero.yChange, this.world.width, this.game.height + this.hero.yChange);

        // the built in camera follow methods won't work for our needs
        // this is a custom follow style that will not ever move down, it only moves up
        this.cameraYMin = Math.min(this.cameraYMin, this.hero.y - this.game.height + 130);
        this.camera.y = this.cameraYMin;

        // hero collisions and movement
        this.physics.arcade.collide(this.hero, this.platforms);
        this.heroMove();

        // for each plat form, find out which is the highest
        // if one goes below the camera view, then create a new one at a distance from the highest one
        // these are pooled so they are very performant
        this.platforms.forEachAlive(function (elem) {
            this.platformYMin = Math.min(this.platformYMin, elem.y);
            if (elem.y > this.camera.y + this.game.height) {
                elem.kill();
                this.platformsCreateOne(
                    this.rnd.integerInRange(0, this.world.width - 50),
                    this.platformYMin - 100,
                    this.PLATFORM_SIZE);
            }
        }, this);

        if (this.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
            this.nextLevel();
        }
    },

    shutdown: function () {
        // reset everything, or the world will be messed up
        this.world.setBounds(0, 0, this.game.width, this.game.height);
        this.cursor = null;
        this.hero.destroy();
        this.hero = null;
        this.platforms.destroy();
        this.platforms = null;
    },

    platformsCreate: function () {
        // platform basic setup
        this.platforms = this.add.group();
        this.platforms.enableBody = true;
        this.platforms.createMultiple(10, 'pixel');

        // create the base platform, with buffer on either side so that the hero doesn't fall through
        this.platformsCreateOne(-16, this.world.height - 16, this.world.width + 100);

        // create a batch of platforms that start to move up the level
        for (var i = 0; i < 9; i++) {
            this.platformsCreateOne(
                this.rnd.integerInRange(0, this.world.width - 50),
                this.world.height - 100 - 100 * i,
                this.PLATFORM_SIZE);
        }
    },

    platformsCreateOne: function (x, y, width) {
        // this is a helper function since writing all of this out can get verbose elsewhere
        var platform = this.platforms.getFirstDead();
        platform.reset(x, y);
        platform.scale.x = width;
        platform.scale.y = 16;
        platform.body.immovable = true;
        return platform;
    },

    heroCreate: function () {
        // basic hero setup
        this.hero = this.game.add.sprite(this.world.centerX, this.world.height - 100, 'hero');
        //this.hero.anchor.set(0.5);
        this.hero.scale.set(2,2);

        // track where the hero started and how much the distance has changed from that point
        this.hero.yOrig = this.hero.y;
        this.hero.yChange = 0;

        // hero collision setup
        // disable all collisions except for down
        this.physics.arcade.enable(this.hero);
        this.hero.body.gravity.y = 500;
        this.hero.body.checkCollision.up = false;
        this.hero.body.checkCollision.left = false;
        this.hero.body.checkCollision.right = false;

        // Add animations
        this.hero.animations.add('walk', [0], 10, true);
        this.hero.animations.add('jump', [0,1], 10, true);
        this.hero.animations.play('walk');
    },

    heroMove: function () {
        // handle the left and right movement of the hero
        if (this.cursor.left.isDown) {
            this.hero.body.velocity.x = -200;
        } else if (this.cursor.right.isDown) {
            this.hero.body.velocity.x = 200;
        } else {
            this.hero.body.velocity.x = 0;
        }

        // handle hero jumping
        //if (this.cursor.up.isDown && this.hero.body.touching.down) {
        if(this.hero.body.touching.down) {
            this.hero.body.velocity.y = -410;
            this.hero.animations.play('walk');
        }else{
            this.hero.animations.play('jump');
        }

        // wrap world coordinated so that you can warp from left to right and right to left
        this.world.wrap(this.hero, this.hero.width / 2, false);

        // track the maximum amount that the hero has travelled
        this.hero.yChange = Math.max(this.hero.yChange, Math.abs(this.hero.y - this.hero.yOrig));

        // if the hero falls below the camera view, gameover
        if (this.hero.y > this.cameraYMin + this.game.height && this.hero.alive) {
            this.music.stop();
            this.state.start('Level1');
        }
    },
    nextLevel: function (pointer) {
        // And start the actual game
        this.state.start('Level2');
        this.music.stop();
    }
};