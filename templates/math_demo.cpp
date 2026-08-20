#include <iostream>
#include <cmath>

struct Vector3 {
    float x, y, z;
};

struct Vector2 {
    float x, y;
};

struct Matrix4x4 {
    float m[4][4];
};

bool WorldToScreen(Vector3 worldPos, Vector2 &screenPos, Matrix4x4 viewMatrix, int screenWidth, int screenHeight) {
    // Standard 3D to 2D projection math
    float clipW = worldPos.x * viewMatrix.m[0][3] + worldPos.y * viewMatrix.m[1][3] + worldPos.z * viewMatrix.m[2][3] + viewMatrix.m[3][3];
    
    if (clipW < 0.1f) {
        return false; // Behind camera
    }
    
    float clipX = worldPos.x * viewMatrix.m[0][0] + worldPos.y * viewMatrix.m[1][0] + worldPos.z * viewMatrix.m[2][0] + viewMatrix.m[3][0];
    float clipY = worldPos.x * viewMatrix.m[0][1] + worldPos.y * viewMatrix.m[1][1] + worldPos.z * viewMatrix.m[2][1] + viewMatrix.m[3][1];
    
    float ndcX = clipX / clipW;
    float ndcY = clipY / clipW;
    
    screenPos.x = (screenWidth / 2.0f) * (ndcX + 1.0f);
    screenPos.y = (screenHeight / 2.0f) * (1.0f - ndcY);
    
    return true;
}

int main() {
    std::cout << "=== Mock WorldToScreen Math Demo ===" << std::endl;
    
    // Mock ViewMatrix (Identity matrix with slight translation for demo)
    Matrix4x4 mockMatrix = {{
        {1.0f, 0.0f, 0.0f, 0.0f},
        {0.0f, 1.0f, 0.0f, 0.0f},
        {0.0f, 0.0f, 1.0f, 0.0f},
        {0.0f, 0.0f, 5.0f, 1.0f}
    }};
    
    // Mock Entity Position
    Vector3 mockEntityPos = {100.0f, 50.0f, 200.0f};
    
    // Mock Screen Size
    int screenW = 1920;
    int screenH = 1080;
    
    Vector2 screenPos;
    
    if (WorldToScreen(mockEntityPos, screenPos, mockMatrix, screenW, screenH)) {
        std::cout << "Entity is on screen!" << std::endl;
        std::cout << "Screen X: " << screenPos.x << std::endl;
        std::cout << "Screen Y: " << screenPos.y << std::endl;
    } else {
        std::cout << "Entity is off screen (behind camera)." << std::endl;
    }
    
    return 0;
}
