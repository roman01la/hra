#include <bullet/btBulletDynamicsCommon.h>

btDefaultCollisionConfiguration *collisionConfiguration;
btCollisionDispatcher *dispatcher;
btBroadphaseInterface *broadphase;
btSequentialImpulseConstraintSolver *sol;
btDiscreteDynamicsWorld *dynamicsWorld;

extern "C" void createEmptyDynamicsWorld()
{
    collisionConfiguration = new btDefaultCollisionConfiguration();
    dispatcher = new btCollisionDispatcher(collisionConfiguration);
    broadphase = new btDbvtBroadphase();
    sol = new btSequentialImpulseConstraintSolver();
    dynamicsWorld = new btDiscreteDynamicsWorld(dispatcher, broadphase, sol, collisionConfiguration);

    dynamicsWorld->setGravity(btVector3(0, -10, 0));
}

extern "C" void stepSimulation(float deltaTime)
{
    dynamicsWorld->stepSimulation(deltaTime);
}

extern "C" void *createBoxShape(float width, float height, float depth)
{
    btVector3 halfExtents = btVector3(width, height, depth) * 0.5f;
    btBoxShape *box = new btBoxShape(halfExtents);
    return box;
}

extern "C" void *createRigidBody(float mass, float ox, float oy, float oz, btCollisionShape *shape)
{
    btAssert((!shape || shape->getShapeType() != INVALID_SHAPE_PROXYTYPE));

    bool isDynamic = (mass != 0.f);

    btVector3 localInertia(0, 0, 0);
    if (isDynamic)
    {
        shape->calculateLocalInertia(mass, localInertia);
    }

    btTransform startTransform;
    startTransform.setIdentity();
    startTransform.setOrigin(btVector3(ox, oy, oz));

    btDefaultMotionState *myMotionState = new btDefaultMotionState(startTransform);

    btRigidBody::btRigidBodyConstructionInfo cInfo(mass, myMotionState, shape, localInertia);

    btRigidBody *body = new btRigidBody(cInfo);

    body->setUserIndex(-1);
    dynamicsWorld->addRigidBody(body);
    return body;
}