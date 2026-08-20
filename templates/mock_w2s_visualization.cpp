#include <iostream>
#include <vector>
#include <iomanip>
#include <cmath>

// Safe Research: Mock WorldToScreen Visualization
// Demonstrates 3D-to-2D projection math using mock data and console visualization.
// Does NOT interact with any game process or read live memory.

struct Vector3 { float x, y, z; };
struct Vector2 { float x, y; };

struct MockEntity {
    std::string name;
    Vector3 position;
    int health;
};

// 4x4 Column-Major Matrix
struct Matrix4x4 {
    float m[16];
};

bool WorldToScreen(const Vector3& pos, Vector2& screen, const Matrix4x4& matrix, int screenWidth, int screenHeight) {
    // Clip coordinates
    float clipX = pos.x * matrix.m[0] + pos.y * matrix.m[4] + pos.z * matrix.m[8] + matrix.m[12];
    float clipY = pos.x * matrix.m[1] + pos.y * matrix.m[5] + pos.z * matrix.m[9] + matrix.m[13];
    float clipW = pos.x * matrix.m[3] + pos.y * matrix.m[7] + pos.z * matrix.m[11] + matrix.m[15];

    if (clipW < 0.1f) return false; // Behind camera

    // Normalized Device Coordinates (NDC)
    float ndcX = clipX / clipW;
    float ndcY = clipY / clipW;

    // Screen coordinates
    screen.x = (screenWidth / 2.0f) * (ndcX + 1.0f);
    screen.y = (screenHeight / 2.0f) * (1.0f - ndcY);

    return true;
}

void DrawConsoleOverlay(const std::vector<MockEntity>& entities, const Matrix4x4& viewProj, int width, int height) {
    std::cout << "\n=== Console Diagnostic Overlay (" << width << "x" << height << ") ===\n";
    for (const auto& ent : entities) {
        Vector2 screenPos;
        if (WorldToScreen(ent.position, screenPos, viewProj, width, height)) {
            // Check if on screen bounds
            if (screenPos.x >= 0 && screenPos.x <= width && screenPos.y >= 0 && screenPos.y <= height) {
                std::cout << "[DRAW] Box at X:" << std::fixed << std::setprecision(1) << screenPos.x 
                          << " Y:" << screenPos.y 
                          << " | " << ent.name << " (HP:" << ent.health << ")\n";
            } else {
                std::cout << "[OFF-SCREEN] " << ent.name << "\n";
            }
        } else {
            std::cout << "[BEHIND-CAM] " << ent.name << "\n";
        }
    }
    std::cout << "========================================\n\n";
}

int main() {
    std::cout << "--- Mock WorldToScreen Demo ---\n";
    
    // Mock ViewProjection Matrix (Identity-ish for demo)
    Matrix4x4 viewProj = {
        1.0f, 0.0f, 0.0f, 0.0f,
        0.0f, 1.0f, 0.0f, 0.0f,
        0.0f, 0.0f, 1.0f, 1.0f, // W = Z
        0.0f, 0.0f, 0.0f, 0.0f
    };
    
    std::vector<MockEntity> entities = {
        {"Enemy_1", {10.0f, 5.0f, 20.0f}, 100},
        {"Enemy_2", {-15.0f, 0.0f, 50.0f}, 75},
        {"Enemy_3", {0.0f, 0.0f, -5.0f}, 50} // Behind camera
    };
    
    DrawConsoleOverlay(entities, viewProj, 1920, 1080);
    
    std::cout << "--- Demo Finished ---\n";
    return 0;
}
