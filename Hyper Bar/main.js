title = "Hyper Bar";

description = `
[Hold] Defend
Let green things through
`;

characters = [
// Enemy
`
  rr  
 rrrr 
rrrrrr
rrrrrr
 rrrr 
  rr  
`,
// Helper
`
  gg  
  gg  
gggggg
gggggg
  gg  
  gg  
`
];

options = {
  isPlayingBgm: true,
  theme: "pixel",
  viewSize: {x: 160, y: 90}
};

// Constants
const SCREEN_WIDTH = 160;
const SCREEN_HEIGHT = 90;
const SCREEN_CENTER = vec(160/2, 90/2);

const BAR_THICKNESS = 8;
const BAR_LENGTH_GROW_INCREMENT = 2;
const BAR_LENGTH_SHRINK_INCREMENT = 16;
const ENEMY_SPEED = 0.25;
const HELPER_SPEED = 1.25;
const PROJECTILE_DAMAGE = 36;
const BOMB_RADIUS_INCREMENT = 4;

// Mutable Properties
let barLength;
let projectilesArray;
let inBombPhase;
let currBombRadius;
let ticksUntilNextHelper;

function updatePlayerBar() {
  // Make center hitbox
  color("black");
  bar(SCREEN_CENTER, 0, BAR_THICKNESS, 0);

  color(barLength >= 0 ? "purple" : "blue");
  bar(SCREEN_CENTER, Math.max(barLength, 0), BAR_THICKNESS, 0);
  color("black");

  // If the bar currently has negative length, automatically increase it until it's 0.
  if (barLength < 0) {
    barLength = Math.min(barLength + BAR_LENGTH_GROW_INCREMENT*(3/4), 0);
    return;
  }

  if (input.isPressed) {
    barLength = Math.min(barLength + BAR_LENGTH_GROW_INCREMENT, SCREEN_WIDTH*(3/4));
  }
  else if (barLength >= 0) {
    barLength = Math.max(barLength - BAR_LENGTH_SHRINK_INCREMENT, 0);
  }
}

// Update projectiles based on their current properties
function updateAllProjectiles() {
  let projectilesToRemove = [];
  let cleanUpProjectiles = () => {
    remove(projectilesArray, (p) => {return projectilesToRemove.includes(p);});
  }

  // Things to do after a helper is picked up
  if (inBombPhase) {
    currBombRadius += BOMB_RADIUS_INCREMENT;

    // Keep track of any projectiles in the radius
    for (let proj of projectilesArray) {
      proj.xPos = proj.xPos + proj.xVel;
      char(proj.projType == "enemy" ? "a": "b", proj.xPos, SCREEN_HEIGHT/2);
      if (abs(proj.xPos - SCREEN_CENTER.x) <= currBombRadius) {
        let pointValue = proj.projType == "enemy" ? difficulty * 3 : 0;
        addScore(pointValue, proj.xPos, SCREEN_HEIGHT/2);
        projectilesToRemove.push(proj);
      }
    }

    cleanUpProjectiles();
    if (currBombRadius >= SCREEN_WIDTH/2) {
      inBombPhase = false;
      currBombRadius = 0;
    }
    return;
  }

  // Not currently in a bomb phase
  let gameEnd = false;
  for (proj of projectilesArray) {
    proj.xPos = proj.xPos + proj.xVel;
    let projCollision = char(proj.projType == "enemy" ? "a": "b", proj.xPos, SCREEN_HEIGHT/2);

    // Projectile collided with the center of the player bar
    if (projCollision.isColliding.rect.black) {
      if (proj.projType == "enemy") {
        gameEnd = true;
      }
      if (proj.projType == "helper") {
        // Reset bar length
        barLength = 0;

        inBombPhase = true;
        projectilesToRemove.push(proj);

        addScore(difficulty * 5, proj.xPos, SCREEN_HEIGHT/2);
        play("powerUp");
      }
    }

    // Projectile collided with a grown bar
    if (projCollision.isColliding.rect.purple && barLength > 0) {
      projectilesToRemove.push(proj);
      barLength -= PROJECTILE_DAMAGE;
      addScore(proj.projType == "enemy" ? difficulty : 0, proj.xPos, SCREEN_HEIGHT/2);
      play("select");
    }
  }

  // If an enemy projectile collided with the center of the player bar, end the game
  if (gameEnd) {
    play("lucky", {note: "E1"})
    end("GAME OVER");
    return;
  }

  cleanUpProjectiles();
}

// Function to spawn either an enemy or helper projectile on a randomly selected edge of the screen
// type will be either "enemy" or "helper"
function spawnProj(projType) {
  let spawningSide = rndi() ? "left" : "right";
  // Note: the origin of char() is the center of the thing that is to be drawn.
  spawnXPos = spawningSide == "left" ? 0 - 3: SCREEN_WIDTH + 3;

  spawnXVel = projType == "enemy" ? ENEMY_SPEED : HELPER_SPEED;
  spawnXVel *= spawningSide == "left" ? 1 : -1;

  projectilesArray.push({
    projType: projType,
    xPos: spawnXPos,
    xVel: spawnXVel
  });
}

function update() {
  // Code to be run right after the title screen
  if (!ticks) {
    barLength = 0;
    projectilesArray = [];
    inBombPhase = false;
    currBombRadius = 0;
    ticksUntilNextHelper = 360;
  }

  updatePlayerBar();

  // Logic for spawning projectiles
  if (ticksUntilNextHelper == 0) {
    spawnProj("helper");
    ticksUntilNextHelper = rndi(480, 601); // Random time from 8 to 10 seconds
  }
  ticksUntilNextHelper--;
  if ((ticks + rndi(6)) % 15 == 0) {
    spawnProj("enemy");
  }

  updateAllProjectiles();
}

addEventListener("load", onLoad);