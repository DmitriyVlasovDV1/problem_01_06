#version 300 es
precision highp float;

uniform float uTime;
uniform vec3 uMandNumberSegment;
uniform vec3 uMandComplexNumber;
uniform vec3 uMandSlide;
uniform float uMandScale;
uniform float uMandTimeSpeed;

uniform sampler2D uMandTex0;
uniform sampler2D uMandTex1;
uniform sampler2D uMandTex2;
uniform sampler2D uMandTex3;

out vec4 oColor;

in vec3 TexCoord;

void main(void)
{
    //oColor = vec4(1.0, 0.0, 0.0, 1.0);
    //return;
    float x = (gl_FragCoord.x - uMandSlide.x); // - uMandCenter.x) * uMandScale + uMandCenter.x;
    float y = (gl_FragCoord.y + uMandSlide.y); // - uMandCenter.y) * uMandScale + uMandCenter.y;
      
    float rl = x * (uMandNumberSegment.x / 500.0) - uMandNumberSegment.x * 0.5;
    float im = y * (uMandNumberSegment.y / 500.0) - uMandNumberSegment.y * 0.5;

    float tmp;
    float cnt = 0.0;

    while (rl * rl + im * im < 4.0 && cnt < 255.0)
    {
        tmp = rl * rl - im * im + uMandComplexNumber.x * sin(uTime * uMandTimeSpeed);
        im = 2.0 * im * rl + uMandComplexNumber.y * sin(uTime * uMandTimeSpeed);
        rl = tmp;
        cnt += 1.0;
    }
    if (cnt >= 255.0)
      oColor = texture(uMandTex0, TexCoord.xy);
    else
      oColor = texture(uMandTex2, TexCoord.xy);  
}