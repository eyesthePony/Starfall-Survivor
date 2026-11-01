import { RingFire } from "../Component/Fire/RingFire";
import { SineMove } from "../Component/Move/SineMove";
import { SpiralFire } from "../Component/Fire/SpiralFire";
import { GameConstants } from "./GameConstants";
import { FloatAnimator } from "../Component/Animator/FloatAnimator";
import { PulseAnimator } from "../Component/Animator/PulseAnimator";
import { SpinAnimator } from "../Component/Animator/SpinAnimator";
import { CannonBarrage } from "../Component/Fire/CannonBarrage";
import { BossMoveTo } from "../Component/Move/BossMoveTo";



export const SkillMap:Record<string,any> = {
    [GameConstants.BOSS_SKILL.SINE_MOVE]:SineMove,
    [GameConstants.BOSS_SKILL.RING_FIRE]: RingFire,
    [GameConstants.BOSS_SKILL.SPIRAL_FIRE]: SpiralFire,
    [GameConstants.BOSS_SKILL.CANNON_BARRAGE]:CannonBarrage,
    [GameConstants.BOSS_SKILL.BOSSMOVETO]: BossMoveTo,

}

export const AnimatorMap:Record<string,any> = {
    [GameConstants.ANIMATOR_TYPE.FLOAT_ANIMATOR]:FloatAnimator,
    [GameConstants.ANIMATOR_TYPE.PULSE_ANIMATOR]:PulseAnimator,
    [GameConstants.ANIMATOR_TYPE.SPIN_ANIMATOR]:SpinAnimator,
}


