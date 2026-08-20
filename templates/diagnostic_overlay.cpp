#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <cmath>

// ========================================================================
// MOCK DIAGNOSTIC OVERLAY
// This file is generated for offline educational debugging purposes ONLY.
// It reads from a mock JSON/text file instead of a live process.
// ========================================================================

struct Vector3 { float x, y, z; };
struct Vector2 { float x, y; };

struct Matrix4x4 {
    float m[4][4];
};

struct MockEntity {
    int id;
    float health;
    Vector3 position;
    int team;
};

// Real World to Screen Math implementation
bool WorldToScreen(const Vector3& pos, Vector2& screen, const Matrix4x4& matrix, int screenWidth, int screenHeight) {
    float screenW = (matrix.m[0][3] * pos.x) + (matrix.m[1][3] * pos.y) + (matrix.m[2][3] * pos.z) + matrix.m[3][3];

    if (screenW < 0.001f) {
        return false;
    }

    float screenX = (matrix.m[0][0] * pos.x) + (matrix.m[1][0] * pos.y) + (matrix.m[2][0] * pos.z) + matrix.m[3][0];
    float screenY = (matrix.m[0][1] * pos.x) + (matrix.m[1][1] * pos.y) + (matrix.m[2][1] * pos.z) + matrix.m[3][1];

    screen.x = (screenWidth / 2.0f) + (screenX / screenW) * (screenWidth / 2.0f);
    screen.y = (screenHeight / 2.0f) - (screenY / screenW) * (screenHeight / 2.0f);

    return true;
}

void DrawBox(const Vector2& pos, float health) {
    std::cout << "[OVERLAY] Draw Box at (" << pos.x << ", " << pos.y << ") | Health: " << health << std::endl;
}

int main(int argc, char** argv) {
    std::cout << "--- Starting Mock Diagnostic Overlay ---" << std::endl;

    // Generate mock data
    std::vector<MockEntity> mockEntities = {
        { 1, 100.0f, { 500.0f, 200.0f, 100.0f }, 1 },
        { 2, 75.5f, { -300.0f, 800.0f, 50.0f }, 2 },
        { 3, 10.0f, { 100.0f, -500.0f, 200.0f }, 2 }
    };

    // Mock identity-like view matrix
    Matrix4x4 mockMatrix = {
        1.0f, 0.0f, 0.0f, 0.0f,
        0.0f, 1.0f, 0.0f, 0.0f,
        0.0f, 0.0f, 1.0f, 0.0f,
        0.0f, 0.0f, 0.0f, 1.0f
    };

    int screenWidth = 1920;
    int screenHeight = 1080;

    std::cout << "Processing " << mockEntities.size() << " mock entities..." << std::endl;

    for (const auto& entity : mockEntities) {
        Vector2 screenPos;
        if (WorldToScreen(entity.position, screenPos, mockMatrix, screenWidth, screenHeight)) {
            DrawBox(screenPos, entity.health);
        }
    }

    std::cout << "--- Overlay Loop Completed ---" << std::endl;
    return 0;
}
