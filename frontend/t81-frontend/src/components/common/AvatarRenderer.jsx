import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAnimations, OrbitControls, Environment } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import * as THREE from "three";

const animationCache = {};

function FBXModel({ url, playing, avatarName }) {
    const groupRef = useRef();
    const mixerRef = useRef();
    const currentActionRef = useRef();
    const isBaseLoaded = useRef(false);

    useEffect(() => {
        let isMounted = true;
        const loader = new FBXLoader();
        loader.load(
            `/animations/sentiments/${avatarName}/${avatarName}_sa001_happy.fbx`,
            (baseFbx) => {
                if (!isMounted) return;
                baseFbx.scale.setScalar(0.01);
                baseFbx.position.set(0, -1, 0);

                baseFbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                groupRef.current.add(baseFbx);
                mixerRef.current = new THREE.AnimationMixer(baseFbx);
                isBaseLoaded.current = true;

                if (url) {
                    loadAndPlayAnimation(url);
                }
            },
            undefined,
            (err) => {
                if (isMounted) console.error("FBX Base load error:", err);
            }
        );

        return () => {
            isMounted = false;
            if (groupRef.current) {
                while (groupRef.current.children.length) {
                    groupRef.current.remove(groupRef.current.children[0]);
                }
            }
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
            }
            isBaseLoaded.current = false;
        };

    }, [avatarName]);

    const loadAndPlayAnimation = (animUrl) => {
        if (!animUrl || !mixerRef.current) return;

        const playClip = (clip) => {
            if (currentActionRef.current) {
                const newAction = mixerRef.current.clipAction(clip);
                newAction.setLoop(THREE.LoopOnce, 1);
                newAction.clampWhenFinished = true;
                newAction.reset();
                newAction.play();

                if (playing) {
                    currentActionRef.current.crossFadeTo(newAction, 0.2, true);
                } else {
                    currentActionRef.current.stop();
                }
                currentActionRef.current = newAction;
            } else {
                const action = mixerRef.current.clipAction(clip);
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
                if (playing) {
                    action.reset();
                    action.play();
                }
                currentActionRef.current = action;
            }
        };

        if (animationCache[animUrl]) {
            playClip(animationCache[animUrl]);
        } else {
            const loader = new FBXLoader();
            loader.load(animUrl, (fbx) => {
                if (fbx.animations && fbx.animations.length > 0) {
                    const clip = fbx.animations[0];
                    animationCache[animUrl] = clip;
                    if (animUrl === url) {
                        playClip(clip);
                    }
                }
            }, undefined, (err) => console.error("FBX Anim load error:", err));
        }
    };

    useEffect(() => {
        if (isBaseLoaded.current) {
            loadAndPlayAnimation(url);
        }

    }, [url]);

    useEffect(() => {
        if (!currentActionRef.current) return;
        if (playing) {
            currentActionRef.current.paused = false;
        } else {
            currentActionRef.current.paused = true;
        }
    }, [playing]);

    useFrame((_, delta) => {
        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }
    });

    return <group ref={groupRef} />;
}

function SceneContent({ animationUrl, playing, avatarName }) {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
            <pointLight position={[-5, 5, -5]} intensity={0.4} color="#aaaaff" />
            <Environment preset="city" />
            <OrbitControls
                enablePan={false}
                minDistance={2}
                maxDistance={8}
                target={[0, 0, 0]}
            />
            <Suspense fallback={null}>
                <FBXModel url={animationUrl} playing={playing} avatarName={avatarName} />
            </Suspense>
        </>
    );
}

export function AvatarRenderer({ animationUrl, playing, avatarName = "AJ" }) {
    return (
        <Canvas
            shadows
            camera={{ position: [0, 1, 4], fov: 50 }}
            style={{ width: "100%", height: "100%" }}
        >
            <SceneContent animationUrl={animationUrl} playing={playing} avatarName={avatarName} />
        </Canvas>
    );
}
